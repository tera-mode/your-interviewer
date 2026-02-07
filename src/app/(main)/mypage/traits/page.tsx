import { redirect } from 'next/navigation';

// 旧 /mypage/traits は /mypage に統合
export default function TraitsRedirect() {
  redirect('/mypage');
}
