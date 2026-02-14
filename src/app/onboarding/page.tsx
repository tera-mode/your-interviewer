import { redirect } from 'next/navigation';

// オンボーディングは廃止。プロフィール設定は /mypage/settings から任意で行う
export default function OnboardingRedirect() {
  redirect('/mypage?tab=profile');
}
