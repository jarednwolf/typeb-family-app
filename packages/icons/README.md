@typeb/icons

React SVG icon components shared across TypeB apps.

Exports:
- Individual icons: IconHome, IconUsers, IconChart, IconCheck, IconCog, IconTask
- A Icon component that takes a name prop: home|users|chart|check|cog|task

Usage example:

```tsx
import { Icon } from '@typeb/icons';

export function Example() {
  return <Icon name="cog" size={20} className="text-gray-800" />;
}
```


