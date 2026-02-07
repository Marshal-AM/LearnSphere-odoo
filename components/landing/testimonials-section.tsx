"use client"

import Image from "next/image"

export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 pt-4 md:pt-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-[1.3]">
            What our users say
            <br />
            about <span className="bg-[#2F81F7] text-white px-3 py-1 inline-block">LearnSphere</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto pb-8">
            Join a community of learners and educators who are transforming their lives through online education.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="relative">
            <div className="bg-white border-4 border-black rounded-3xl py-8 md:py-14 px-6 md:px-8 md:pr-72 lg:pr-72">
              <div className="absolute -top-6 md:-top-8 left-6 md:left-8 w-12 h-12 md:w-16 md:h-16 bg-[#FDB927] border-2 border-black rounded-full flex items-center justify-center font-bold text-2xl">
                "
              </div>

              <div className="md:max-w-[65%] mt-4">
                <p className="text-sm md:text-base lg:text-lg mb-6 leading-relaxed">
                  LearnSphere has completely changed how I learn. The AI quizzes help me identify my weak spots immediately, and the ability to connect with instructors via video call is a game-changer. I've earned 3 badges this month alone!
                </p>

                <div>
                  <div className="font-bold text-base md:text-lg">Sarah Jenkins</div>
                  <div className="text-gray-600 text-sm md:text-base">Data Science Student</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full overflow-hidden hidden lg:block border-4 border-black bg-[#FF6B7A]">
              <Image
                src="/landing-images/ui-ux-design.svg"
                alt="Creative Student"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
