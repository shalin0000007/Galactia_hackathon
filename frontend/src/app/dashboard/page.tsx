// Redirect /dashboard → / (Person A's dashboard is the official one at root)
import { redirect } from 'next/navigation';

export default function DashboardRedirect() {
  redirect('/');
}
