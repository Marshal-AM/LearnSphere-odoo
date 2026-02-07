'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Camera, Save, User as UserIcon, Mail, Shield, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { FileUpload } from '@/components/ui/file-upload';
import { Modal } from '@/components/ui/modal';
import { updateProfile } from '@/lib/actions';
import { BADGE_LABELS, BADGE_COLORS } from '@/lib/types';
import type { User } from '@/lib/types';

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
      // Refresh the NextAuth session so the navbar picks up the new name/avatar
      await updateSession();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Avatar section */}
        <div className="bg-gradient-to-r from-primary/10 to-indigo-50 p-8 flex items-center gap-6">
          <div className="relative group">
            <Avatar
              firstName={firstName}
              lastName={lastName}
              src={avatarUrl || undefined}
              size="xl"
            />
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
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
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{user.total_points}</p>
              <p className="text-xs text-amber-600">Total Points</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <div
                className="w-6 h-6 rounded-full mx-auto mb-2"
                style={{ backgroundColor: BADGE_COLORS[user.current_badge] }}
              />
              <p className="text-lg font-bold text-purple-700">{BADGE_LABELS[user.current_badge]}</p>
              <p className="text-xs text-purple-600">Current Badge</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <UserIcon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-blue-700 capitalize">
                {(Array.isArray(user.roles) ? user.roles : []).join(', ')}
              </p>
              <p className="text-xs text-blue-600">Role</p>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            {saved && (
              <p className="text-sm text-green-600 font-medium">Profile saved successfully!</p>
            )}
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="w-4 h-4" />
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

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
                className="text-sm text-red-600 hover:text-red-700 cursor-pointer"
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
