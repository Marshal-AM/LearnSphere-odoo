export function LogoMarquee() {
  const items = [
    { logo: "/landing-logos/application.svg", alt: "application" },
    { logo: "/landing-logos/business.svg", alt: "business" },
    { logo: "/landing-logos/company.svg", alt: "company" },
    { logo: "/landing-logos/startup.svg", alt: "startup" },
    { logo: "/landing-logos/venture.svg", alt: "venture" },
    { logo: "/landing-logos/agency.svg", alt: "agency" },
  ]

  return (
    <div className="overflow-hidden">
      <div className="relative overflow-hidden bg-black py-16 -rotate-[5deg] mt-32 mb-16 min-w-[120vw] -mx-[10vw] left-0">
        <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
          {[...items, ...items, ...items, ...items].map((item, index) => (
            <img key={index} src={item.logo || "/placeholder.svg"} alt={item.alt} className="h-12 w-auto" />
          ))}
        </div>
      </div>
    </div>
  )
}
