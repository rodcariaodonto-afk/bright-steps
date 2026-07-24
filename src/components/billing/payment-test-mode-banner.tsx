const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-red-300 bg-red-100 px-4 py-2 text-center text-sm text-red-800">
        Os pagamentos em produção ainda não foram configurados. Conclua a ativação no painel do Lovable para aceitar cobranças reais.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-orange-300 bg-orange-100 px-4 py-2 text-center text-sm text-orange-800">
        Todos os pagamentos na prévia rodam em modo teste. Use o cartão 4242 4242 4242 4242 para simular.
      </div>
    );
  }
  return null;
}
