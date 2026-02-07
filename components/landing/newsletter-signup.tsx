import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterSignup() {
  return (
    <div className="bg-[#FFC224] border-[3px] border-black rounded-[32px] p-8 md:p-16 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      <div className="relative z-10 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#0B0B0B]">
          Subscribe to our newsletter
        </h2>
        <p className="text-[#393939] text-lg mb-8 font-medium">
          Get the latest updates on new courses, features, and learning tips delivered straight to your inbox.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input 
            type="email" 
            placeholder="Enter your email" 
            className="bg-white border-2 border-black h-14 text-lg rounded-xl flex-1"
          />
          <Button className="bg-black text-white hover:bg-black/90 h-14 px-8 rounded-xl font-bold text-lg">
            Subscribe
          </Button>
        </div>
      </div>
    </div>
  )
}
