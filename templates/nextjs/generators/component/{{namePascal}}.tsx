{{#if (eq client "true")}}'use client';

{{/if}}interface {{namePascal}}Props {
  children?: React.ReactNode;
}

export function {{namePascal}}({ children }: {{namePascal}}Props) {
  return (
    <div>
      {children}
    </div>
  );
}
