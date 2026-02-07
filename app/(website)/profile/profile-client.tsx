'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Camera, Save, User as UserIcon, Mail, Shield, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { FileUpload } from '@/components/ui/file-upload';
import { Modal } from '@/components/ui/modal';
import { updateProfile } from '@/lib/actions';
import { BADGE_LABELS, BADGE_COLORS } from '@/lib/types';
import type { User } from '@/lib/types';
import { motion } from 'framer-motion';

export default function ProfileClient({ user }: { user: User }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl || undefined,
      });
      await updateSession();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {/* Avatar section */}
        <div className="bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 p-8 flex items-center gap-6">
          <div className="relative group">
            <Avatar
              firstName={firstName}
              lastName={lastName}
              src={avatarUrl || undefined}
              size="xl"
            />
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-3">
              {(Array.isArray(user.roles) ? user.roles : []).map(role => (
                <Badge key={role} variant={role === 'admin' ? 'error' : role === 'instructor' ? 'primary' : 'default'}>
                  <Shield className="w-3 h-3" />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last name"
              required
            />
          </div>

          <div>
            <Input
              label="Email"
              value={user.email}
              readOnly
              disabled
              helperText="Email cannot be changed"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl text-center border border-amber-100/50">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-amber-700">{user.total_points}</p>
              <p className="text-xs text-amber-600">Total Points</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl text-center border border-purple-100/50">
              <div
                className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: `${BADGE_COLORS[user.current_badge]}20` }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: BADGE_COLORS[user.current_badge] }}
                />
              </div>
              <p className="text-lg font-bold text-purple-700">{BADGE_LABELS[user.current_badge]}</p>
              <p className="text-xs text-purple-600">Current Badge</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl text-center border border-blue-100/50">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-sky-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-lg font-bold text-blue-700 capitalize">
                {(Array.isArray(user.roles) ? user.roles : []).join(', ')}
              </p>
              <p className="text-xs text-blue-600">Role</p>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            {saved && (
              <motion.p
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-emerald-600 font-medium"
              >
                Profile saved successfully!
              </motion.p>
            )}
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="w-4 h-4" />
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Avatar Upload Modal */}
      <Modal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        title="Upload Profile Picture"
        size="sm"
      >
        <div className="p-6">
          <FileUpload
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            folder="avatars"
            hint="PNG, JPG up to 5 MB. Square images work best."
            currentUrl={avatarUrl}
            onUpload={(result) => {
              setAvatarUrl(result.url);
              setAvatarModalOpen(false);
            }}
          />
          {avatarUrl && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setAvatarUrl('');
                  setAvatarModalOpen(false);
                }}
                className="text-sm text-red-500 hover:text-red-600 font-medium cursor-pointer"
              >
                Remove current picture
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
