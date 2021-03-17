import PropTypes from 'prop-types';
import React from 'react';

const shortFmt = new Intl.DateTimeFormat([], {
  dateStyle: 'short',
  timeStyle: 'short',
});

const fullFmt = new Intl.DateTimeFormat([], {
  timeZone: 'UTC',
  dateStyle: 'full',
  timeStyle: 'full',
});

export default function Timestamp(props: {date: unknown}) {
  const { date } = props;

  if (!isValidDate(date)) {
    return (
      <em>N/A</em>
    );
  }

  return (
    <abbr title={fullFmt.format(date)}>
      <time dateTime={date.toISOString()}>
        {shortFmt.format(date)}
      </time>
    </abbr>
  );
}
Timestamp.propTypes = {
  date: PropTypes.instanceOf(Date),
};

function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.valueOf());
}
