import React from 'react';
import Timeline from 'react-calendar-timeline';
import moment from 'moment';
import 'react-calendar-timeline/lib/Timeline.css';

const GanttChart = ({ tasks }) => {
  // Convert time string to moment object for the timeline
  const convertToMoment = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return moment().hours(hours).minutes(minutes).seconds(0);
  };

  const items = tasks.map(task => ({
    id: task.id,
    group: task.group,
    title: task.title,
    start_time: convertToMoment(task.start_time),
    end_time: convertToMoment(task.end_time),
  }));

  const groups = [...new Set(tasks.map(task => task.group))].map((group, index) => ({
    id: index + 1,
    title: group,
  }));

  return (
    <div>
      <Timeline
        groups={groups}
        items={items}
        defaultTimeStart={convertToMoment('08:00')}
        defaultTimeEnd={convertToMoment('12:00')}
        lineHeight={60}
        itemHeightRatio={0.75}
      />
    </div>
  );
};

export default GanttChart;
