import React from 'react';
import Gantt from 'react-gantt-antd';
import 'react-gantt-antd/lib/css/style.css';
import { ConfigProvider } from 'antd';
import enUS from '../node_modules/antd/es/locale/en_US';  // Ensure the import path is correct

export default function App() {
  // Define the tasks for the first project
  const tasksA = [
    {
      id: "task1",
      title: "Task 1",
      start: new Date('2020-06-01'),
      end: new Date('2020-08-02'),
    }
  ];

  // Define the tasks for the sub-project
  const tasksB = [
    {
      id: "task2",
      title: "Task 2",
      start: new Date('2020-07-01'),
      end: new Date('2020-09-02'),
    }
  ];

  // Define the sub-project with its tasks
  const subProjects = [
    {
      id: "subProject1",
      title: "Sub Project 1",
      tasks: tasksB,
    }
  ];

  // Define the main project with its tasks and sub-projects
  const projects = [
    {
      id: "project1",
      title: "Main Project",
      tasks: tasksA,
      projects: subProjects,
      isOpen: false,
    }
  ];

  return (
    <ConfigProvider locale={enUS}>
      <Gantt
        start={new Date('2020-06-01')}
        end={new Date('2020-10-01')}
        now={new Date('2020-07-01')}
        zoom={1}
        projects={projects}
        enableSticky
        scrollToNow
      />
    </ConfigProvider>
  );
}
