import nextDynamic from "next/dynamic";

export const dynamic = 'force-dynamic';

const CheckoutContent = nextDynamic(() => import('./CheckoutContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  )
});

export default function CheckoutPage() {
  return <CheckoutContent />;
}
