{{#if (eq withProps "true")}}
interface {{namePascal}}Props {
  children?: React.ReactNode;
  className?: string;
}

export function {{namePascal}}({ children, className }: {{namePascal}}Props) {
{{else}}
export function {{namePascal}}() {
{{/if}}
  return (
    <div{{#if (eq withProps "true")}} className={className}{{/if}}>
      {{namePascal}}
      {{#if (eq withProps "true")}}
      {children}
      {{/if}}
    </div>
  );
}
