import { permanentRedirect } from 'next/navigation';

export default function InfoRedirectPage() {
  permanentRedirect('/about');
}
