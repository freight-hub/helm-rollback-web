import PropTypes from 'prop-types';
import React from 'react';

const shortDateFmt = new Intl.DateTimeFormat([], {
  dateStyle: 'short',
});
const shortTimeFmt = new Intl.DateTimeFormat([], {
  timeStyle: 'short',
});
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
        {displayString(date)}
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

function displayString(date: Date) {
  const now = Date.now();

  const hourAgo = now - (60 * 60 * 1000);
  if (date.valueOf() > hourAgo) {
    const minutesAgo = Math.round((now - date.valueOf()) / 60 / 1000);
    const agoText = `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
    return `${agoText}, ${shortTimeFmt.format(date)}`;
  }

  const nowDate = shortDateFmt.format(now);
  const thenDate = shortDateFmt.format(date);

  if (nowDate === thenDate) {
    return `Today @ ${shortTimeFmt.format(date)}`;
  }

  return shortFmt.format(date);
}
