import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export default function AnimatedTestimonialsDemo() {
  const testimonials = [
    {
      quote:
        "I plan efficient routes and share real local stories — so you see more and travel comfortably.",
      name: "Kasun Perera",
      designation: "National Guide • Colombo",
      details: ["⭐ 4.9", "8+ years", "English • Sinhala", "Cultural triangle"],
      src: "/wallpapers/2.jpg",
    },
    {
      quote:
        "Smooth airport transfers and islandwide trips — I guide while driving and keep your schedule stress‑free.",
      name: "Nadeesha Silva",
      designation: "Chauffeur Guide • Negombo",
      details: ["⭐ 4.8", "6+ years", "English • Tamil • Sinhala", "Airport pickups"],
      src: "/wallpapers/3.jpg",
    },
    {
      quote:
        "In the central province, I’ll take you beyond the main spots — viewpoints, tea estates, and calm hidden paths.",
      name: "Imesha Fernando",
      designation: "Area Guide • Kandy",
      details: ["⭐ 4.9", "5+ years", "English • Sinhala", "Tea country"],
      src: "/wallpapers/1.jpg",
    },
    {
      quote:
        "I specialize in Sigiriya and nearby sites — history, timings, and the best photo angles.",
      name: "Ruwan Jayasinghe",
      designation: "Site Guide • Sigiriya",
      details: ["⭐ 5.0", "10+ years", "English • Sinhala", "Sigiriya • Dambulla"],
      src: "/wallpapers/2.jpg",
    },
    {
      quote:
        "Coastal routes are my favorite — fort stories, local cafés, and the best beaches for your vibe.",
      name: "Tharindu Senanayake",
      designation: "National Guide • Galle",
      details: ["⭐ 4.8", "7+ years", "English • Sinhala", "South coast"],
      src: "/wallpapers/3.jpg",
    },
    {
      quote:
        "I’ll help you plan the perfect hill‑country day: hikes, waterfalls, and scenic train views.",
      name: "Ayesha Wickramasinghe",
      designation: "Area Guide • Ella",
      details: ["⭐ 4.7", "4+ years", "English • Sinhala", "Hikes • Waterfalls"],
      src: "/wallpapers/1.jpg",
    },
    {
      quote:
        "Discover the north with a local — culture, history, and authentic food stops along the way.",
      name: "Suresh Kumar",
      designation: "Chauffeur Guide • Jaffna",
      details: ["⭐ 4.9", "9+ years", "English • Tamil", "Northern culture"],
      src: "/wallpapers/2.jpg",
    },
    {
      quote:
        "Ancient city tours are better with context — I’ll guide you through the ruins with clear stories.",
      name: "Dilshan Weerasinghe",
      designation: "Site Guide • Polonnaruwa",
      details: ["⭐ 4.9", "11+ years", "English • Sinhala", "Ruins • Museums"],
      src: "/wallpapers/3.jpg",
    },
    {
      quote:
        "If you prefer a calm pace, I design relaxed trips — nature, coastal stays, and beautiful mornings.",
      name: "Shanika Hettiarachchi",
      designation: "National Guide • Matara",
      details: ["⭐ 4.8", "6+ years", "English • Sinhala", "Nature"],
      src: "/wallpapers/1.jpg",
    },
    {
      quote:
        "The east coast is special — I’ll guide you to the best beaches and snorkeling spots at the right time.",
      name: "Farhan Ameer",
      designation: "Area Guide • Trincomalee",
      details: ["⭐ 4.7", "5+ years", "English • Tamil", "East coast"],
      src: "/wallpapers/2.jpg",
    },
  ];

  return (
    <AnimatedTestimonials
      testimonials={testimonials}
      autoplay
      autoplayIntervalMs={5_000}
    />
  );
}
