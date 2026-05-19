-- AlterTable
ALTER TABLE "m_driver_services" RENAME CONSTRAINT "DriverService_pkey" TO "m_driver_services_pkey";

-- AlterTable
ALTER TABLE "m_guide_gallery_images" RENAME CONSTRAINT "GuideGalleryImage_pkey" TO "m_guide_gallery_images_pkey";

-- AlterTable
ALTER TABLE "m_guide_itineraries" RENAME CONSTRAINT "GuideItinerary_pkey" TO "m_guide_itineraries_pkey";

-- AlterTable
ALTER TABLE "m_guide_itinerary_days" RENAME CONSTRAINT "GuideItineraryDay_pkey" TO "m_guide_itinerary_days_pkey";

-- AlterTable
ALTER TABLE "m_guide_itinerary_images" RENAME CONSTRAINT "GuideItineraryImage_pkey" TO "m_guide_itinerary_images_pkey";

-- AlterTable
ALTER TABLE "m_guide_itinerary_inclusions" RENAME CONSTRAINT "GuideItineraryInclusion_pkey" TO "m_guide_itinerary_inclusions_pkey";

-- AlterTable
ALTER TABLE "m_guide_languages" RENAME CONSTRAINT "GuideLanguage_pkey" TO "m_guide_languages_pkey";

-- AlterTable
ALTER TABLE "m_guide_profiles" RENAME CONSTRAINT "GuideProfile_pkey" TO "m_guide_profiles_pkey";

-- AlterTable
ALTER TABLE "m_roles" RENAME CONSTRAINT "Role_pkey" TO "m_roles_pkey";

-- AlterTable
ALTER TABLE "m_safari_jeep_charges" RENAME CONSTRAINT "SafariJeepCharge_pkey" TO "m_safari_jeep_charges_pkey";

-- AlterTable
ALTER TABLE "m_safari_jeep_images" RENAME CONSTRAINT "SafariJeepImage_pkey" TO "m_safari_jeep_images_pkey";

-- AlterTable
ALTER TABLE "m_safari_jeeps" RENAME CONSTRAINT "SafariJeep_pkey" TO "m_safari_jeeps_pkey";

-- AlterTable
ALTER TABLE "m_transport_provider_profiles" RENAME CONSTRAINT "TransportProviderProfile_pkey" TO "m_transport_provider_profiles_pkey";

-- AlterTable
ALTER TABLE "m_transport_vehicle_charges" RENAME CONSTRAINT "TransportVehicleCharge_pkey" TO "m_transport_vehicle_charges_pkey";

-- AlterTable
ALTER TABLE "m_transport_vehicle_images" RENAME CONSTRAINT "TransportVehicleImage_pkey" TO "m_transport_vehicle_images_pkey";

-- AlterTable
ALTER TABLE "m_transport_vehicles" RENAME CONSTRAINT "TransportVehicle_pkey" TO "m_transport_vehicles_pkey";

-- AlterTable
ALTER TABLE "m_users" RENAME CONSTRAINT "User_pkey" TO "m_users_pkey";

-- AlterTable
ALTER TABLE "r_auth_identities" RENAME CONSTRAINT "AuthIdentity_pkey" TO "r_auth_identities_pkey";

-- AlterTable
ALTER TABLE "r_user_roles" RENAME CONSTRAINT "UserRole_pkey" TO "r_user_roles_pkey";

-- AlterTable
ALTER TABLE "t_audit_logs" RENAME CONSTRAINT "AuditLog_pkey" TO "t_audit_logs_pkey";

-- AlterTable
ALTER TABLE "t_guide_application_status_history" RENAME CONSTRAINT "ApplicationStatusHistory_pkey" TO "t_guide_application_status_history_pkey";

-- AlterTable
ALTER TABLE "t_guide_applications" RENAME CONSTRAINT "GuideApplication_pkey" TO "t_guide_applications_pkey";

-- AlterTable
ALTER TABLE "t_otp_codes" RENAME CONSTRAINT "OtpCode_pkey" TO "t_otp_codes_pkey";

-- AlterTable
ALTER TABLE "t_sessions" RENAME CONSTRAINT "session_pkey" TO "t_sessions_pkey";

-- AlterTable
ALTER TABLE "t_transport_application_status_history" RENAME CONSTRAINT "TransportApplicationStatusHistory_pkey" TO "t_transport_application_status_history_pkey";

-- AlterTable
ALTER TABLE "t_transport_provider_applications" RENAME CONSTRAINT "TransportProviderApplication_pkey" TO "t_transport_provider_applications_pkey";

-- AlterTable
ALTER TABLE "t_transport_type_change_requests" RENAME CONSTRAINT "TransportProviderTypeChangeRequest_pkey" TO "t_transport_type_change_requests_pkey";

-- RenameForeignKey
ALTER TABLE "m_driver_services" RENAME CONSTRAINT "DriverService_profileId_fkey" TO "m_driver_services_profileId_fkey";

-- RenameForeignKey
ALTER TABLE "m_guide_gallery_images" RENAME CONSTRAINT "GuideGalleryImage_guideProfileId_fkey" TO "m_guide_gallery_images_guideProfileId_fkey";

-- RenameForeignKey
ALTER TABLE "m_guide_itineraries" RENAME CONSTRAINT "GuideItinerary_guideProfileId_fkey" TO "m_guide_itineraries_guideProfileId_fkey";

-- RenameForeignKey
ALTER TABLE "m_guide_itinerary_days" RENAME CONSTRAINT "GuideItineraryDay_itineraryId_fkey" TO "m_guide_itinerary_days_itineraryId_fkey";

-- RenameForeignKey
ALTER TABLE "m_guide_itinerary_images" RENAME CONSTRAINT "GuideItineraryImage_itineraryId_fkey" TO "m_guide_itinerary_images_itineraryId_fkey";

-- RenameForeignKey
ALTER TABLE "m_guide_itinerary_inclusions" RENAME CONSTRAINT "GuideItineraryInclusion_itineraryId_fkey" TO "m_guide_itinerary_inclusions_itineraryId_fkey";

-- RenameForeignKey
ALTER TABLE "m_guide_languages" RENAME CONSTRAINT "GuideLanguage_guideProfileId_fkey" TO "m_guide_languages_guideProfileId_fkey";

-- RenameForeignKey
ALTER TABLE "m_guide_profiles" RENAME CONSTRAINT "GuideProfile_applicationId_fkey" TO "m_guide_profiles_applicationId_fkey";

-- RenameForeignKey
ALTER TABLE "m_guide_profiles" RENAME CONSTRAINT "GuideProfile_userId_fkey" TO "m_guide_profiles_userId_fkey";

-- RenameForeignKey
ALTER TABLE "m_safari_jeep_charges" RENAME CONSTRAINT "SafariJeepCharge_safariJeepId_fkey" TO "m_safari_jeep_charges_safariJeepId_fkey";

-- RenameForeignKey
ALTER TABLE "m_safari_jeep_images" RENAME CONSTRAINT "SafariJeepImage_safariJeepId_fkey" TO "m_safari_jeep_images_safariJeepId_fkey";

-- RenameForeignKey
ALTER TABLE "m_safari_jeeps" RENAME CONSTRAINT "SafariJeep_profileId_fkey" TO "m_safari_jeeps_profileId_fkey";

-- RenameForeignKey
ALTER TABLE "m_transport_provider_profiles" RENAME CONSTRAINT "TransportProviderProfile_applicationId_fkey" TO "m_transport_provider_profiles_applicationId_fkey";

-- RenameForeignKey
ALTER TABLE "m_transport_provider_profiles" RENAME CONSTRAINT "TransportProviderProfile_userId_fkey" TO "m_transport_provider_profiles_userId_fkey";

-- RenameForeignKey
ALTER TABLE "m_transport_vehicle_charges" RENAME CONSTRAINT "TransportVehicleCharge_vehicleId_fkey" TO "m_transport_vehicle_charges_vehicleId_fkey";

-- RenameForeignKey
ALTER TABLE "m_transport_vehicle_images" RENAME CONSTRAINT "TransportVehicleImage_vehicleId_fkey" TO "m_transport_vehicle_images_vehicleId_fkey";

-- RenameForeignKey
ALTER TABLE "m_transport_vehicles" RENAME CONSTRAINT "TransportVehicle_profileId_fkey" TO "m_transport_vehicles_profileId_fkey";

-- RenameForeignKey
ALTER TABLE "r_auth_identities" RENAME CONSTRAINT "AuthIdentity_userId_fkey" TO "r_auth_identities_userId_fkey";

-- RenameForeignKey
ALTER TABLE "r_user_roles" RENAME CONSTRAINT "UserRole_roleId_fkey" TO "r_user_roles_roleId_fkey";

-- RenameForeignKey
ALTER TABLE "r_user_roles" RENAME CONSTRAINT "UserRole_userId_fkey" TO "r_user_roles_userId_fkey";

-- RenameForeignKey
ALTER TABLE "t_audit_logs" RENAME CONSTRAINT "AuditLog_userId_fkey" TO "t_audit_logs_userId_fkey";

-- RenameForeignKey
ALTER TABLE "t_guide_application_status_history" RENAME CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" TO "t_guide_application_status_history_applicationId_fkey";

-- RenameForeignKey
ALTER TABLE "t_guide_application_status_history" RENAME CONSTRAINT "ApplicationStatusHistory_updatedBy_fkey" TO "t_guide_application_status_history_updatedBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_guide_applications" RENAME CONSTRAINT "GuideApplication_createdBy_fkey" TO "t_guide_applications_createdBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_guide_applications" RENAME CONSTRAINT "GuideApplication_statusUpdatedBy_fkey" TO "t_guide_applications_statusUpdatedBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_guide_applications" RENAME CONSTRAINT "GuideApplication_updatedBy_fkey" TO "t_guide_applications_updatedBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_otp_codes" RENAME CONSTRAINT "OtpCode_userId_fkey" TO "t_otp_codes_userId_fkey";

-- RenameForeignKey
ALTER TABLE "t_transport_application_status_history" RENAME CONSTRAINT "TransportApplicationStatusHistory_applicationId_fkey" TO "t_transport_application_status_history_applicationId_fkey";

-- RenameForeignKey
ALTER TABLE "t_transport_application_status_history" RENAME CONSTRAINT "TransportApplicationStatusHistory_updatedBy_fkey" TO "t_transport_application_status_history_updatedBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_transport_provider_applications" RENAME CONSTRAINT "TransportProviderApplication_createdBy_fkey" TO "t_transport_provider_applications_createdBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_transport_provider_applications" RENAME CONSTRAINT "TransportProviderApplication_statusUpdatedBy_fkey" TO "t_transport_provider_applications_statusUpdatedBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_transport_provider_applications" RENAME CONSTRAINT "TransportProviderApplication_updatedBy_fkey" TO "t_transport_provider_applications_updatedBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_transport_type_change_requests" RENAME CONSTRAINT "TransportProviderTypeChangeRequest_createdBy_fkey" TO "t_transport_type_change_requests_createdBy_fkey";

-- RenameForeignKey
ALTER TABLE "t_transport_type_change_requests" RENAME CONSTRAINT "TransportProviderTypeChangeRequest_profileId_fkey" TO "t_transport_type_change_requests_profileId_fkey";

-- RenameForeignKey
ALTER TABLE "t_transport_type_change_requests" RENAME CONSTRAINT "TransportProviderTypeChangeRequest_reviewedBy_fkey" TO "t_transport_type_change_requests_reviewedBy_fkey";

-- RenameIndex
ALTER INDEX "DriverService_profileId_idx" RENAME TO "m_driver_services_profileId_idx";

-- RenameIndex
ALTER INDEX "GuideGalleryImage_guideProfileId_idx" RENAME TO "m_guide_gallery_images_guideProfileId_idx";

-- RenameIndex
ALTER INDEX "GuideGalleryImage_guideProfileId_sortOrder_idx" RENAME TO "m_guide_gallery_images_guideProfileId_sortOrder_idx";

-- RenameIndex
ALTER INDEX "GuideItinerary_guideProfileId_idx" RENAME TO "m_guide_itineraries_guideProfileId_idx";

-- RenameIndex
ALTER INDEX "GuideItinerary_guideProfileId_sortOrder_idx" RENAME TO "m_guide_itineraries_guideProfileId_sortOrder_idx";

-- RenameIndex
ALTER INDEX "GuideItineraryDay_itineraryId_idx" RENAME TO "m_guide_itinerary_days_itineraryId_idx";

-- RenameIndex
ALTER INDEX "GuideItineraryDay_itineraryId_sortOrder_idx" RENAME TO "m_guide_itinerary_days_itineraryId_sortOrder_idx";

-- RenameIndex
ALTER INDEX "GuideItineraryImage_itineraryId_idx" RENAME TO "m_guide_itinerary_images_itineraryId_idx";

-- RenameIndex
ALTER INDEX "GuideItineraryImage_itineraryId_sortOrder_idx" RENAME TO "m_guide_itinerary_images_itineraryId_sortOrder_idx";

-- RenameIndex
ALTER INDEX "GuideItineraryInclusion_itineraryId_idx" RENAME TO "m_guide_itinerary_inclusions_itineraryId_idx";

-- RenameIndex
ALTER INDEX "GuideLanguage_guideProfileId_idx" RENAME TO "m_guide_languages_guideProfileId_idx";

-- RenameIndex
ALTER INDEX "GuideLanguage_guideProfileId_language_key" RENAME TO "m_guide_languages_guideProfileId_language_key";

-- RenameIndex
ALTER INDEX "GuideProfile_applicationId_idx" RENAME TO "m_guide_profiles_applicationId_idx";

-- RenameIndex
ALTER INDEX "GuideProfile_applicationId_key" RENAME TO "m_guide_profiles_applicationId_key";

-- RenameIndex
ALTER INDEX "GuideProfile_userId_idx" RENAME TO "m_guide_profiles_userId_idx";

-- RenameIndex
ALTER INDEX "GuideProfile_userId_key" RENAME TO "m_guide_profiles_userId_key";

-- RenameIndex
ALTER INDEX "Role_name_key" RENAME TO "m_roles_name_key";

-- RenameIndex
ALTER INDEX "SafariJeepCharge_safariJeepId_idx" RENAME TO "m_safari_jeep_charges_safariJeepId_idx";

-- RenameIndex
ALTER INDEX "SafariJeepImage_safariJeepId_idx" RENAME TO "m_safari_jeep_images_safariJeepId_idx";

-- RenameIndex
ALTER INDEX "SafariJeepImage_safariJeepId_sortOrder_idx" RENAME TO "m_safari_jeep_images_safariJeepId_sortOrder_idx";

-- RenameIndex
ALTER INDEX "SafariJeep_profileId_idx" RENAME TO "m_safari_jeeps_profileId_idx";

-- RenameIndex
ALTER INDEX "TransportProviderProfile_applicationId_idx" RENAME TO "m_transport_provider_profiles_applicationId_idx";

-- RenameIndex
ALTER INDEX "TransportProviderProfile_applicationId_key" RENAME TO "m_transport_provider_profiles_applicationId_key";

-- RenameIndex
ALTER INDEX "TransportProviderProfile_userId_idx" RENAME TO "m_transport_provider_profiles_userId_idx";

-- RenameIndex
ALTER INDEX "TransportProviderProfile_userId_key" RENAME TO "m_transport_provider_profiles_userId_key";

-- RenameIndex
ALTER INDEX "TransportVehicleCharge_vehicleId_idx" RENAME TO "m_transport_vehicle_charges_vehicleId_idx";

-- RenameIndex
ALTER INDEX "TransportVehicleImage_vehicleId_idx" RENAME TO "m_transport_vehicle_images_vehicleId_idx";

-- RenameIndex
ALTER INDEX "TransportVehicleImage_vehicleId_sortOrder_idx" RENAME TO "m_transport_vehicle_images_vehicleId_sortOrder_idx";

-- RenameIndex
ALTER INDEX "TransportVehicle_profileId_idx" RENAME TO "m_transport_vehicles_profileId_idx";

-- RenameIndex
ALTER INDEX "User_email_idx" RENAME TO "m_users_email_idx";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "m_users_email_key";

-- RenameIndex
ALTER INDEX "AuthIdentity_provider_providerUserId_key" RENAME TO "r_auth_identities_provider_providerUserId_key";

-- RenameIndex
ALTER INDEX "AuthIdentity_userId_idx" RENAME TO "r_auth_identities_userId_idx";

-- RenameIndex
ALTER INDEX "UserRole_roleId_idx" RENAME TO "r_user_roles_roleId_idx";

-- RenameIndex
ALTER INDEX "AuditLog_createdAt_idx" RENAME TO "t_audit_logs_createdAt_idx";

-- RenameIndex
ALTER INDEX "AuditLog_userId_idx" RENAME TO "t_audit_logs_userId_idx";

-- RenameIndex
ALTER INDEX "OtpCode_email_purpose_idx" RENAME TO "t_otp_codes_email_purpose_idx";

-- RenameIndex
ALTER INDEX "OtpCode_expiresAt_idx" RENAME TO "t_otp_codes_expiresAt_idx";

-- RenameIndex
ALTER INDEX "TransportProviderTypeChangeRequest_profileId_idx" RENAME TO "t_transport_type_change_requests_profileId_idx";

-- RenameIndex
ALTER INDEX "TransportProviderTypeChangeRequest_status_idx" RENAME TO "t_transport_type_change_requests_status_idx";
