import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const formData = await req.formData()

  const fullName = String(formData.get("fullName") ?? "")
  const displayName = String(formData.get("displayName") ?? "")
  const category = String(formData.get("category") ?? "")

  const mobileNumber = String(
    formData.get("mobileNumber") ?? formData.get("telephone") ?? formData.get("tel") ?? ""
  )
  const whatsappAvailable = String(formData.get("whatsappAvailable") ?? "")
  const address = String(formData.get("address") ?? "")
  const nicNumber = String(formData.get("nicNumber") ?? "")
  const registrationNo = String(formData.get("registrationNo") ?? "")
  const email = String(formData.get("email") ?? "")
  const guideLicenseExpiryDate = String(formData.get("guideLicenseExpiryDate") ?? "")

  const nicFront = formData.get("nicFront")
  const nicBack = formData.get("nicBack")
  const guideLicensePhoto = formData.get("guideLicensePhoto")

  const missing: string[] = []
  if (!fullName.trim()) missing.push("fullName")
  if (!displayName.trim()) missing.push("displayName")
  if (!category.trim()) missing.push("category")

  if (!mobileNumber.trim()) missing.push("mobileNumber")
  if (!whatsappAvailable.trim()) missing.push("whatsappAvailable")
  if (!address.trim()) missing.push("address")
  if (!nicNumber.trim()) missing.push("nicNumber")
  if (!registrationNo.trim()) missing.push("registrationNo")
  if (!email.trim()) missing.push("email")
  if (!guideLicenseExpiryDate.trim()) missing.push("guideLicenseExpiryDate")
  if (!(nicFront instanceof File)) missing.push("nicFront")
  if (!(nicBack instanceof File)) missing.push("nicBack")
  if (!(guideLicensePhoto instanceof File)) missing.push("guideLicensePhoto")

  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields", missing },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    received: {
      fullName,
      displayName,
      category,

      mobileNumber,
      whatsappAvailable,
      address,
      nicNumber,
      registrationNo,
      email,
      guideLicenseExpiryDate,
      uploads: {
        nicFront: (nicFront as File).name,
        nicBack: (nicBack as File).name,
        guideLicensePhoto: (guideLicensePhoto as File).name,
      },
    },
  })
}

