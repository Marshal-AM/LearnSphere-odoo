'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Camera, Save, User as UserIcon, Mail, Shield, Trophy, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { FileUpload } from '@/components/ui/file-upload';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { updateProfile } from '@/lib/actions';
import { BADGE_LABELS, BADGE_COLORS, BADGE_THRESHOLDS } from '@/lib/types';
import type { User, BadgeLevel } from '@/lib/types';

const BADGE_ORDER: BadgeLevel[] = ['newbie', 'explorer', 'achiever', 'specialist', 'expert', 'master'];

export default function ProfileClient({ user }: { user: User }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentBadgeIdx = BADGE_ORDER.indexOf(user.current_badge);

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
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Avatar section */}
        <div className="bg-primary-50 p-8 flex items-center gap-6 border-b border-gray-100">
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

          {/* Badge Progression */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Badge Progress</h3>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-900">{user.total_points}</span>
                <span className="text-xs text-gray-500">points</span>
              </div>
            </div>

            <div className="relative flex items-start justify-between">
              {/* Connecting line */}
              <div className="absolute top-[18px] left-[18px] right-[18px] h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute top-[18px] left-[18px] h-0.5 bg-primary z-0 transition-all"
                style={{ width: `calc(${(currentBadgeIdx / (BADGE_ORDER.length - 1)) * 100}% - 36px)` }}
              />

              {BADGE_ORDER.map((badge, idx) => {
                const isAchieved = idx <= currentBadgeIdx;
                const isCurrent = idx === currentBadgeIdx;
                return (
                  <div key={badge} className="flex flex-col items-center z-10 relative">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                        isCurrent && 'ring-4 ring-primary/20 border-primary scale-110',
                        isAchieved && !isCurrent && 'border-primary bg-primary/10',
                        !isAchieved && 'border-gray-200 bg-white'
                      )}
                      style={isCurrent ? { backgroundColor: BADGE_COLORS[badge], borderColor: BADGE_COLORS[badge] } : {}}
                    >
                      {isCurrent ? (
                        <Trophy className="w-4 h-4 text-white" />
                      ) : isAchieved ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-gray-300" />
                      )}
                    </div>
                    <span className={cn(
                      'text-[10px] mt-1.5 font-medium text-center leading-tight',
                      isCurrent ? 'text-primary font-semibold' : isAchieved ? 'text-gray-700' : 'text-gray-400'
                    )}>
                      {BADGE_LABELS[badge]}
                    </span>
                    <span className={cn(
                      'text-[9px]',
                      isCurrent ? 'text-primary/70' : 'text-gray-400'
                    )}>
                      {BADGE_THRESHOLDS[badge]} pts
                    </span>
                  </div>
                );
              })}
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
