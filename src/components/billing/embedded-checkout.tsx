import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useCallback, useMemo } from "react";

import { useLocale } from "@/i18n/hooks";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/modules/billing/api.functions";

interface Props {
  priceId: string;
  returnUrl: string;
}

export function BillingEmbeddedCheckout({ priceId, returnUrl }: Props) {
  const { locale } = useLocale();

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const result = await createCheckoutSession({
      data: { priceId, returnUrl, environment: getStripeEnvironment(), locale },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Sessão de checkout inválida.");
    return result.clientSecret;
  }, [priceId, returnUrl, locale]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div id="checkout" className="min-h-[600px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

