import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { toast } from 'sonner';
import { Check, CreditCard } from 'lucide-react';

type Plan = {
  name: string;
  code: 'starter' | 'pro' | 'enterprise';
  setup: string;
  monthly: string;
  features: string[];
  recommended: boolean;
};

const plans: Plan[] = [
  {
    name: 'Starter',
    code: 'starter',
    setup: '$499',
    monthly: '$149/mo',
    features: ['1 location', 'Missed call SMS', 'Lead qualification', 'Basic pipeline', 'Email support'],
    recommended: false,
  },
  {
    name: 'Professional',
    code: 'pro',
    setup: '$799',
    monthly: '$299/mo',
    features: ['Up to 3 locations', 'Everything in Starter', 'Review routing', 'Custom SMS templates', 'Priority support', 'ROI dashboard'],
    recommended: true,
  },
  {
    name: 'Enterprise',
    code: 'enterprise',
    setup: 'Custom',
    monthly: 'Custom',
    features: ['Unlimited locations', 'Everything in Professional', 'Custom integrations', 'Dedicated onboarding', 'White-glove support', 'API access'],
    recommended: false,
  },
];

export default function Billing() {
  const { workspace } = useWorkspace();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: Plan) => {
    if (plan.code === 'enterprise') {
      window.location.href = 'mailto:sales@nexaos.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    if (!workspace) {
      toast.error('Workspace not loaded');
      return;
    }

    try {
      setLoadingPlan(plan.code);
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          workspace_id: workspace.id,
          plan: plan.code,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('No checkout URL returned');

      window.location.assign(data.url as string);
    } catch (err: any) {
      toast.error(err?.message || 'Unable to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Choose a plan to power your business automation</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.recommended ? 'border-primary ring-1 ring-primary/20' : ''}>
              <CardHeader>
                {plan.recommended && <Badge className="w-fit mb-2">Recommended</Badge>}
                <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{plan.monthly}</span>
                  {plan.setup !== 'Custom' && <span className="text-xs text-muted-foreground ml-2">+ {plan.setup} setup</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-accent shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.recommended ? 'default' : 'outline'}
                  disabled={loadingPlan === plan.code}
                  onClick={() => void handleCheckout(plan)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {loadingPlan === plan.code ? 'Redirecting...' : (plan.setup === 'Custom' ? 'Contact Sales' : 'Select Plan')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground text-center">
              Payment processing is handled by Stripe. You will be redirected securely to complete checkout.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
