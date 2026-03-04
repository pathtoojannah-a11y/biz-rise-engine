import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    setup: '$499',
    monthly: '$149/mo',
    features: ['1 location', 'Missed call SMS', 'Lead qualification', 'Basic pipeline', 'Email support'],
    recommended: false,
  },
  {
    name: 'Professional',
    setup: '$799',
    monthly: '$299/mo',
    features: ['Up to 3 locations', 'Everything in Starter', 'Review routing', 'Custom SMS templates', 'Priority support', 'ROI dashboard'],
    recommended: true,
  },
  {
    name: 'Enterprise',
    setup: 'Custom',
    monthly: 'Custom',
    features: ['Unlimited locations', 'Everything in Professional', 'Custom integrations', 'Dedicated onboarding', 'White-glove support', 'API access'],
    recommended: false,
  },
];

export default function Billing() {
  // TODO: Integrate Stripe for subscription checkout when ready
  // For now, this page shows plans and captures interest

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Choose a plan to power your business automation</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map(plan => (
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
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-accent shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {/* TODO: Wire to Stripe checkout */}
                <Button className="w-full" variant={plan.recommended ? 'default' : 'outline'}
                  onClick={() => {
                    // Placeholder — Stripe integration pending
                    alert(`Stripe checkout for ${plan.name} plan is not yet connected. This will be wired in a future sprint.`);
                  }}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {plan.setup === 'Custom' ? 'Contact Sales' : 'Select Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground text-center">
              Payment processing via Stripe. Subscription management and invoicing will be available once Stripe integration is completed.
              {/* TODO: Enable Stripe integration, create products/prices, implement checkout session */}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
