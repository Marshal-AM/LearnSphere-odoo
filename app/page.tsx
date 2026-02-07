'use client';

import Link from 'next/link';
import { BookOpen, GraduationCap, Trophy, BarChart3, ArrowRight, Sparkles, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
        <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-32 left-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LearnSphere</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-primary to-indigo-600 text-white rounded-2xl hover:from-primary-dark hover:to-indigo-700 transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-indigo-50 text-primary-700 rounded-2xl text-sm font-medium mb-6 border border-primary/10">
              <Sparkles className="w-4 h-4" />
              Gamified Learning Experience
            </div>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight"
          >
            Learn, Grow, and{' '}
            <span className="gradient-text">Earn Badges</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mt-6 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto"
          >
            A comprehensive eLearning platform where instructors create engaging courses with videos,
            documents, and quizzes — while learners earn points and badges as they progress.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-2xl font-semibold text-base hover:from-primary-dark hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]"
            >
              Browse Courses
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/admin/courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-2xl font-semibold text-base hover:bg-gray-50 transition-all duration-300 border border-gray-200 shadow-sm hover:shadow-md active:scale-[0.97]"
            >
              Instructor Portal
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          {[
            {
              icon: BookOpen,
              title: 'Rich Content',
              description: 'Video, documents, images, and interactive quizzes in every course.',
              gradient: 'from-blue-500 to-cyan-500',
              bg: 'bg-blue-50',
            },
            {
              icon: GraduationCap,
              title: 'Track Progress',
              description: 'Monitor your learning journey with detailed progress tracking.',
              gradient: 'from-emerald-500 to-teal-500',
              bg: 'bg-emerald-50',
            },
            {
              icon: Trophy,
              title: 'Earn Badges',
              description: 'Complete quizzes to earn points and unlock badge levels.',
              gradient: 'from-amber-500 to-orange-500',
              bg: 'bg-amber-50',
            },
            {
              icon: BarChart3,
              title: 'Reporting',
              description: 'Instructors get detailed analytics on learner engagement.',
              gradient: 'from-violet-500 to-purple-500',
              bg: 'bg-violet-50',
            },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 cursor-default"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Quick Navigation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 sm:p-12 text-white relative"
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <h2 className="text-2xl sm:text-3xl font-bold mb-3 relative">Quick Access</h2>
          <p className="text-white/70 mb-8 max-w-lg relative">
            Jump straight into the platform — explore courses as a learner or manage content as an instructor.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {[
              { label: 'Admin Dashboard', href: '/admin/courses', desc: 'Manage courses', icon: Zap },
              { label: 'Reporting', href: '/admin/reporting', desc: 'View analytics', icon: BarChart3 },
              { label: 'Browse Courses', href: '/courses', desc: 'Find courses', icon: BookOpen },
              { label: 'My Learning', href: '/my-courses', desc: 'Continue learning', icon: Star },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group block p-5 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                <link.icon className="w-5 h-5 text-white/80 mb-3 group-hover:scale-110 transition-transform duration-300" />
                <div className="font-semibold">{link.label}</div>
                <div className="text-sm text-white/60 mt-1">{link.desc}</div>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">LearnSphere</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 LearnSphere. Built for Odoo Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}
