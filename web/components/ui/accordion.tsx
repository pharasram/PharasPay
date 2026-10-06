'use client';
import * as Accordion from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
import { faqs } from '@/lib/content';
export function FaqAccordion({ limit }: { limit?: number }): JSX.Element {
  return (
    <Accordion.Root type="single" collapsible className="divide-y divide-slate-200">
      {faqs.slice(0, limit).map((item, index) => (
        <Accordion.Item value={String(index)} key={item.question} className="group">
          <Accordion.Header>
            <Accordion.Trigger className="flex min-h-16 w-full items-center justify-between gap-4 py-5 text-left text-base font-semibold text-slate-900 focus-visible:outline-primary">
              {item.question}
              <Plus
                aria-hidden
                className="size-5 shrink-0 text-primary transition-transform group-data-[state=open]:rotate-45"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-5 pr-8 text-sm leading-7 text-slate-600">
            {item.answer}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
