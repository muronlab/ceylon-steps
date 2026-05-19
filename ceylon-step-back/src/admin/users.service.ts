import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserStatus } from '@prisma/client';
import { AssignableRole, ASSIGNABLE_ROLES } from './dto/update-user-roles.dto';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  emailVerifiedAt: true,
  sessionInvalidBefore: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  roles: { select: { role: { select: { name: true } } } },
  identities: { select: { id: true, provider: true, createdAt: true } },
  _count: { select: { createdGuideApps: true } },
} satisfies Prisma.UserSelect;

const USER_DETAIL_SELECT = {
  ...USER_SELECT,
  identities: {
    select: { id: true, provider: true, createdAt: true },
    orderBy: { createdAt: Prisma.SortOrder.desc },
  },
  createdGuideApps: {
    select: { id: true, status: true, displayName: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: Prisma.SortOrder.desc },
    take: 5,
  },
} satisfies Prisma.UserSelect;

type AdminContext = { id: string; roles: string[] };

function getRoleNames(rolesField: { role: { name: string } }[] | undefined): string[] {
  return (rolesField ?? []).map((r) => r.role.name);
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toListItem(u: Prisma.UserGetPayload<{ select: typeof USER_SELECT }>) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      emailVerifiedAt: u.emailVerifiedAt,
      sessionInvalidBefore: u.sessionInvalidBefore,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      roles: getRoleNames(u.roles),
      identities: u.identities,
      guideApplicationsCount: u._count.createdGuideApps,
    };
  }

  async list(query: { search?: string; status?: UserStatus; take?: number; skip?: number }) {
    const where: Prisma.UserWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      const term = query.search.trim();
      if (term) {
        where.OR = [
          { email: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const take = Math.min(Math.max(query.take ?? 50, 1), 200);
    const skip = Math.max(query.skip ?? 0, 0);

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      total,
      take,
      skip,
      users: users.map((u) => this.toListItem(u)),
    };
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_DETAIL_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');

    // Fetched separately so a missing GuideProfile table/migration doesn't
    // break the entire user-detail endpoint.
    let guideProfile: {
      id: string;
      displayName: string;
      category: string | null;
      approvedAt: Date;
    } | null = null;
    try {
      const profileClient = (this.prisma as unknown as {
        guideProfile?: {
          findUnique: (args: unknown) => Promise<typeof guideProfile>;
        };
      }).guideProfile;
      if (profileClient) {
        guideProfile = await profileClient.findUnique({
          where: { userId: id },
          select: { id: true, displayName: true, category: true, approvedAt: true },
        });
      }
    } catch {
      // Migration likely not run yet — log nothing user-facing, just skip.
      guideProfile = null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerifiedAt: user.emailVerifiedAt,
      sessionInvalidBefore: user.sessionInvalidBefore,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: getRoleNames(user.roles),
      identities: user.identities,
      guideApplicationsCount: user._count.createdGuideApps,
      recentGuideApplications: user.createdGuideApps,
      guideProfile,
    };
  }

  async setStatus(actor: AdminContext, userId: string, status: UserStatus) {
    if (actor.id === userId) {
      throw new BadRequestException('You cannot change your own status.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roles: { select: { role: { select: { name: true } } } } },
    });
    if (!target) throw new NotFoundException('User not found');

    const targetRoles = getRoleNames(target.roles);
    if (targetRoles.includes('SUPER_ADMIN') && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only a super admin can change a super admin status.');
    }

    const data: Prisma.UserUpdateInput = { status };
    if (status === 'DISABLED') {
      data.sessionInvalidBefore = new Date();
    }

    // Cascade the ADMIN visibility flag onto any partner profiles the user
    // owns — never touch the owner-controlled `isActive` so an owner who's
    // already hidden their own profile stays hidden after a re-enable. The
    // cascade shares a transaction with the user update so a partial failure
    // can't leave a disabled account with a still publicly-listed profile.
    const adminEnabled = status === 'ACTIVE';
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data,
        select: USER_SELECT,
      });

      await tx.guideProfile.updateMany({
        where: { userId },
        data: { adminEnabled },
      });

      await tx.transportProviderProfile.updateMany({
        where: { userId },
        data: { adminEnabled },
      });

      await tx.auditLog.create({
        data: {
          action: `SET_USER_STATUS_${status}`,
          userId: actor.id,
        },
      });

      return u;
    });

    return this.toListItem(updated);
  }

  async setRoles(actor: AdminContext, userId: string, nextRoles: AssignableRole[]) {
    if (actor.id === userId) {
      throw new BadRequestException('You cannot change your own roles.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roles: { select: { roleId: true, role: { select: { name: true } } } } },
    });
    if (!target) throw new NotFoundException('User not found');

    const targetRoles = target.roles.map((r) => r.role.name);

    if (targetRoles.includes('SUPER_ADMIN') && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException("You can't modify a super admin's roles.");
    }

    const desired = new Set<string>(nextRoles);

    if (desired.has('ADMIN') && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only a super admin can grant the ADMIN role.');
    }
    const currentlyAdmin = targetRoles.includes('ADMIN');
    if (currentlyAdmin && !desired.has('ADMIN') && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only a super admin can revoke the ADMIN role.');
    }

    const assignable = new Set<string>(ASSIGNABLE_ROLES);
    const lockedRoles = targetRoles.filter((r) => !assignable.has(r));
    const finalRoleNames = new Set<string>([...lockedRoles, ...desired]);

    const allRoles = await this.prisma.role.findMany({
      where: { name: { in: [...finalRoleNames] } },
      select: { id: true, name: true },
    });
    if (allRoles.length !== finalRoleNames.size) {
      throw new BadRequestException('One or more roles do not exist. Seed roles first.');
    }

    const finalRoleIds = new Set(allRoles.map((r) => r.id));
    const currentRoleIds = new Set(target.roles.map((r) => r.roleId));
    const toAdd = [...finalRoleIds].filter((id) => !currentRoleIds.has(id));
    const toRemove = [...currentRoleIds].filter((id) => !finalRoleIds.has(id));

    await this.prisma.$transaction([
      ...(toRemove.length
        ? [
            this.prisma.userRole.deleteMany({
              where: { userId, roleId: { in: toRemove } },
            }),
          ]
        : []),
      ...toAdd.map((roleId) =>
        this.prisma.userRole.create({ data: { userId, roleId } }),
      ),
      this.prisma.auditLog.create({
        data: {
          action: 'SET_USER_ROLES',
          userId: actor.id,
        },
      }),
    ]);

    return this.detail(userId);
  }
}
