import { Onest } from "next/font/google"
import { Navigation } from "@/components/landing/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { LogoMarquee } from "@/components/landing/logo-marquee"
import { ServicesSection } from "@/components/landing/services-section"
import { AboutSection } from "@/components/landing/about-section"
import { PortfolioSection } from "@/components/landing/portfolio-section"
import { ExperienceSection } from "@/components/landing/experience-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { Footer } from "@/components/landing/footer"

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
})

export default function Home() {
  return (
    <main className={`min-h-screen bg-[#FFFFFF] ${onest.className} font-sans`}>
      <HeroSection />
      <LogoMarquee />
      <ServicesSection />
      <AboutSection />
      <PortfolioSection />
      <ExperienceSection />
      <TestimonialsSection />
      <Footer />
    </main>
  )
}
