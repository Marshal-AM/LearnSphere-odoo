import { getCurrentUser } from '@/lib/auth';
import { getPaidCoursePurchases } from '@/lib/queries';
import PurchasesClient from './purchases-client';

export default async function PurchasesPage() {
  const user = await getCurrentUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');

  // Admins see all purchases, instructors see only their courses' purchases
  const purchases = await getPaidCoursePurchases(isAdmin ? undefined : user?.id);

  return <PurchasesClient purchases={purchases} />;
}
