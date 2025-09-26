import React from 'react';

const DateTimePicker = React.forwardRef((props: any, ref: any) => {
  return (
    <div ref={ref as any}>DateTimePicker Mock</div>
  );
});

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;