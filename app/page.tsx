import Link from 'next/link';
import { BookOpen, GraduationCap, Trophy, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LearnSphere</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Trophy className="w-4 h-4" />
            Gamified Learning Experience
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            Learn, Grow, and{' '}
            <span className="text-primary">Earn Badges</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            A comprehensive eLearning platform where instructors create engaging courses with videos,
            documents, and quizzes — while learners earn points and badges as they progress.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
            >
              Browse Courses
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/admin/courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-xl font-semibold text-base hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
            >
              Instructor Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: BookOpen,
              title: 'Rich Content',
              description: 'Video, documents, images, and interactive quizzes in every course.',
              color: 'bg-blue-100 text-blue-600',
            },
            {
              icon: GraduationCap,
              title: 'Track Progress',
              description: 'Monitor your learning journey with detailed progress tracking.',
              color: 'bg-emerald-100 text-emerald-600',
            },
            {
              icon: Trophy,
              title: 'Earn Badges',
              description: 'Complete quizzes to earn points and unlock badge levels.',
              color: 'bg-amber-100 text-amber-600',
            },
            {
              icon: BarChart3,
              title: 'Reporting',
              description: 'Instructors get detailed analytics on learner engagement.',
              color: 'bg-purple-100 text-purple-600',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-2xl p-8 sm:p-12 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Quick Access</h2>
          <p className="text-white/80 mb-8 max-w-lg">
            Jump straight into the platform — explore courses as a learner or manage content as an instructor.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Admin Dashboard', href: '/admin/courses', desc: 'Manage courses' },
              { label: 'Reporting', href: '/admin/reporting', desc: 'View analytics' },
              { label: 'Browse Courses', href: '/courses', desc: 'Find courses' },
              { label: 'My Learning', href: '/my-courses', desc: 'Continue learning' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <div className="font-semibold">{link.label}</div>
                <div className="text-sm text-white/70 mt-1">{link.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">LearnSphere</span>
          </div>
          <p className="text-sm text-gray-500">© 2026 LearnSphere. Built for Odoo Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}
