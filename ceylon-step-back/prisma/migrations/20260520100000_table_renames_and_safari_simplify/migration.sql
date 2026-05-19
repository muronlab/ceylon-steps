-- Rename all application tables to the industrial convention:
--   m_  = master data (entities)
--   t_  = transactional data (events / logs / requests)
--   r_  = reference / junction tables
--
-- Done as ALTER TABLE ... RENAME TO ... so existing rows + foreign keys are
-- preserved. Prisma's auto-diff would have generated DROP + CREATE, which
-- would have lost data.

-- ── Master (m_) ──────────────────────────────────────────────────────
ALTER TABLE "User" RENAME TO "m_users";
ALTER TABLE "Role" RENAME TO "m_roles";
ALTER TABLE "GuideProfile" RENAME TO "m_guide_profiles";
ALTER TABLE "GuideLanguage" RENAME TO "m_guide_languages";
ALTER TABLE "GuideItinerary" RENAME TO "m_guide_itineraries";
ALTER TABLE "GuideItineraryDay" RENAME TO "m_guide_itinerary_days";
ALTER TABLE "GuideItineraryInclusion" RENAME TO "m_guide_itinerary_inclusions";
ALTER TABLE "GuideItineraryImage" RENAME TO "m_guide_itinerary_images";
ALTER TABLE "GuideGalleryImage" RENAME TO "m_guide_gallery_images";
ALTER TABLE "TransportProviderProfile" RENAME TO "m_transport_provider_profiles";
ALTER TABLE "TransportVehicle" RENAME TO "m_transport_vehicles";
ALTER TABLE "TransportVehicleImage" RENAME TO "m_transport_vehicle_images";
ALTER TABLE "TransportVehicleCharge" RENAME TO "m_transport_vehicle_charges";
ALTER TABLE "DriverService" RENAME TO "m_driver_services";
ALTER TABLE "SafariJeep" RENAME TO "m_safari_jeeps";
ALTER TABLE "SafariJeepImage" RENAME TO "m_safari_jeep_images";
ALTER TABLE "SafariJeepCharge" RENAME TO "m_safari_jeep_charges";

-- ── Reference (r_) ──────────────────────────────────────────────────
ALTER TABLE "UserRole" RENAME TO "r_user_roles";
ALTER TABLE "AuthIdentity" RENAME TO "r_auth_identities";

-- ── Transactional (t_) ──────────────────────────────────────────────
ALTER TABLE "OtpCode" RENAME TO "t_otp_codes";
ALTER TABLE "AuditLog" RENAME TO "t_audit_logs";
ALTER TABLE "GuideApplication" RENAME TO "t_guide_applications";
ALTER TABLE "ApplicationStatusHistory" RENAME TO "t_guide_application_status_history";
ALTER TABLE "TransportProviderApplication" RENAME TO "t_transport_provider_applications";
ALTER TABLE "TransportApplicationStatusHistory" RENAME TO "t_transport_application_status_history";
ALTER TABLE "TransportProviderTypeChangeRequest" RENAME TO "t_transport_type_change_requests";
ALTER TABLE "session" RENAME TO "t_sessions";

-- ── Safari jeep simplification ──────────────────────────────────────
-- Drop fields the operator workflow doesn't need any more. Anything that
-- lived in `facilities` / `extraFacilities` should now go in `inclusions`.
ALTER TABLE "m_safari_jeeps" DROP COLUMN IF EXISTS "manufacturedYear";
ALTER TABLE "m_safari_jeeps" DROP COLUMN IF EXISTS "fuelType";
ALTER TABLE "m_safari_jeeps" DROP COLUMN IF EXISTS "fuelConsumption";
ALTER TABLE "m_safari_jeeps" DROP COLUMN IF EXISTS "plateNumber";
ALTER TABLE "m_safari_jeeps" DROP COLUMN IF EXISTS "plateNumberVisible";
ALTER TABLE "m_safari_jeeps" DROP COLUMN IF EXISTS "driverSpecialties";
ALTER TABLE "m_safari_jeeps" DROP COLUMN IF EXISTS "facilities";
ALTER TABLE "m_safari_jeeps" DROP COLUMN IF EXISTS "extraFacilities";
