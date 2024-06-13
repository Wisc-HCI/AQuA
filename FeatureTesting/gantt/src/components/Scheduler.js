import React from 'react';
import Timeline from 'react-calendar-timeline';
import moment from 'moment';
import 'react-calendar-timeline/lib/Timeline.css';
import './Scheduler.css';

const Scheduler = () => {
  const groups = [
    { id: 1, title: 'Row #0' },
    { id: 2, title: 'Row #1' },
    { id: 3, title: 'Row #2' },
    { id: 4, title: 'Row #3' },
    { id: 5, title: 'Row #4' },
    { id: 6, title: 'Row #5' },
    { id: 7, title: 'Row #6' },
    { id: 8, title: 'Row #7' },
    { id: 9, title: 'Row #8' },
  ];

  const items = [
    { id: 1, group: 1, title: 'Task #38', start_time: moment('2024-06-26 06:00'), end_time: moment('2024-06-26 08:00'), className: 'task-green' },
    { id: 2, group: 1, title: 'Task #99', start_time: moment('2024-06-26 07:00'), end_time: moment('2024-06-26 09:00'), className: 'task-blue' },
    { id: 3, group: 2, title: 'Task #40', start_time: moment('2024-06-26 06:30'), end_time: moment('2024-06-26 10:00'), className: 'task-light-blue' },
    { id: 4, group: 3, title: 'Task #31', start_time: moment('2024-06-26 08:00'), end_time: moment('2024-06-26 10:30'), className: 'task-orange' },
    // Add more tasks similarly...
  ];

  return (
    <div className="scheduler-container">
      <Timeline
        groups={groups}
        items={items}
        defaultTimeStart={moment('2024-06-26 05:00')}
        defaultTimeEnd={moment('2024-06-26 17:00')}
        timeSteps={{ second: 0, minute: 15, hour: 1, day: 1, month: 1, year: 1 }}
        timeFormat={{ hour: 'HH:mm' }}
        headerLabelFormats={{
          time: { long: 'HH:mm', medium: 'HH:mm', short: 'HH:mm' },
          day: { long: 'HH:mm', medium: 'HH:mm', short: 'HH:mm' },
          month: { long: 'HH:mm', medium: 'HH:mm', short: 'HH:mm' },
          year: { long: 'HH:mm', medium: 'HH:mm', short: 'HH:mm' },
        }}
        sidebarContent={<div>Label</div>}
      />
    </div>
  );
};

export default Scheduler;
