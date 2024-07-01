import React, { useState } from 'react';
import Timeline from 'react-calendar-timeline';
import moment from 'moment';
import Modal from 'react-modal';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import 'react-calendar-timeline/lib/Timeline.css';
import './Scheduler.css';

Modal.setAppElement('#root'); // Adjust if your root element ID is different

const Scheduler = () => {
  const [groups, setGroups] = useState([
    { id: 1, title: 'Writing Instruments', children: [2, 3] },
    { id: 2, title: 'Pen' },
    { id: 3, title: 'Pencil' },
    { id: 4, title: 'Row #3' },
    { id: 5, title: 'Row #4' },
    { id: 6, title: 'Row #5' },
    { id: 7, title: 'Row #6' },
    { id: 8, title: 'Row #7' },
    { id: 9, title: 'Row #8' },
  ]);

  const [items, setItems] = useState([
    { id: 1, group: 2, title: 'Task #38', start_time: moment('2024-06-26 06:00'), end_time: moment('2024-06-26 08:00'), className: 'task-green' },
    { id: 2, group: 2, title: 'Task #99', start_time: moment('2024-06-26 07:00'), end_time: moment('2024-06-26 09:00'), className: 'task-blue' },
    { id: 3, group: 3, title: 'Task #40', start_time: moment('2024-06-26 06:30'), end_time: moment('2024-06-26 10:00'), className: 'task-light-blue' },
    { id: 4, group: 4, title: 'Task #31', start_time: moment('2024-06-26 08:00'), end_time: moment('2024-06-26 10:30'), className: 'task-orange' },
    // Add more tasks similarly...
  ]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const openModal = (taskOrGroup) => {
    setCurrentTask(taskOrGroup && taskOrGroup.type === 'task' ? taskOrGroup : null);
    setCurrentGroup(taskOrGroup && taskOrGroup.type === 'group' ? taskOrGroup : null);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentTask(null);
    setCurrentGroup(null);
    setIsAddingTask(false);
    setIsAddingGroup(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const newTitle = e.target.elements.title.value;

    if (isAddingTask) {
      const groupId = parseInt(e.target.elements.groupId.value, 10);
      const startTime = moment(e.target.elements.startTime.value);
      const endTime = moment(e.target.elements.endTime.value);

      const newItem = {
        id: items.length + 1,
        group: groupId,
        title: newTitle,
        start_time: startTime,
        end_time: endTime,
        className: 'task-new'
      };

      setItems([...items, newItem]);
    } else if (isAddingGroup) {
      const newGroup = {
        id: groups.length + 1,
        title: newTitle
      };

      setGroups([...groups, newGroup]);
    } else {
      if (currentTask) {
        setItems(items.map(item => item.id === currentTask.id ? { ...item, title: newTitle } : item));
      }

      if (currentGroup) {
        setGroups(groups.map(group => group.id === currentGroup.id ? { ...group, title: newTitle } : group));
      }
    }

    closeModal();
  };

  const handleDelete = () => {
    if (currentTask) {
      setItems(items.filter(item => item.id !== currentTask.id));
    }

    if (currentGroup) {
      setGroups(groups.filter(group => group.id !== currentGroup.id));
      setItems(items.filter(item => item.group !== currentGroup.id));
    }

    closeModal();
  };

  const handleItemSelect = (itemId) => {
    const task = items.find(item => item.id === itemId);
    openModal({ ...task, type: 'task' });
  };

  const handleGroupEdit = (groupId) => {
    const group = groups.find(group => group.id === groupId);
    openModal({ ...group, type: 'group' });
  };

  const handleAddTask = () => {
    setIsAddingTask(true);
    setModalIsOpen(true);
  };

  const handleAddGroup = () => {
    setIsAddingGroup(true);
    setModalIsOpen(true);
  };

  return (
    <div className="scheduler-container">
      <div className="header">
        <h2>Scheduler</h2>
        <div className="add-buttons">
          <button onClick={handleAddTask} className="add-button"><FaPlus /> Add Task</button>
          <button onClick={handleAddGroup} className="add-button"><FaPlus /> Add Group</button>
        </div>
      </div>
      <Timeline
        groups={groups.map(group => ({
          ...group,
          title: (
            <div className="group-title">
              {group.title}
              <FaEdit onClick={() => handleGroupEdit(group.id)} className="edit-icon" />
            </div>
          )
        }))}
        items={items}
        defaultTimeStart={moment('2024-06-26 05:00')}
        defaultTimeEnd={moment('2024-06-26 17:00')}
        timeSteps={{ second: 0, minute: 15, hour: 1, day: 1, month: 1, year: 1 }}
        timeFormat="HH:mm"
        headerLabelFormats={{
          time: { long: 'HH:mm', medium: 'HH:mm', short: 'HH:mm' },
          day: { long: 'HH:mm', medium: 'HH:mm', short: 'HH:mm' },
          month: { long: 'HH:mm', medium: 'HH:mm', short: 'HH:mm' },
          year: { long: 'HH:mm', medium: 'HH:mm', short: 'HH:mm' },
        }}
        sidebarContent={<div>Label</div>}
        canMove={true}
        canResize={"both"}
        onItemMove={(itemId, dragTime, newGroupOrder) => {
          const group = groups[newGroupOrder];
          const newItems = items.map(item => 
            item.id === itemId
              ? { ...item, start_time: moment(dragTime), end_time: moment(dragTime).add(item.end_time.diff(item.start_time)), group: group.id }
              : item
          );
          setItems(newItems);
        }}
        onItemResize={(itemId, time, edge) => {
          const newItems = items.map(item => 
            item.id === itemId
              ? { ...item, [edge]: moment(time) }
              : item
          );
          setItems(newItems);
        }}
        onItemSelect={handleItemSelect}
      />
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Edit Task or Group"
        className="modal"
        overlayClassName="overlay"
      >
        <h2 className="modal-title">{isAddingTask ? 'Add Task' : isAddingGroup ? 'Add Group' : `Edit ${currentTask ? 'Task' : 'Group'}`}</h2>
        <form onSubmit={handleEditSubmit} className="modal-form">
          <div className="modal-form-group">
            <label htmlFor="title">Title:</label>
            <input type="text" name="title" defaultValue={currentTask ? currentTask.title : currentGroup ? currentGroup.title : ''} required />
          </div>
          {isAddingTask && (
            <>
              <div className="modal-form-group">
                <label htmlFor="groupId">Group ID:</label>
                <input type="number" name="groupId" required />
              </div>
              <div className="modal-form-group">
                <label htmlFor="startTime">Start Time:</label>
                <input type="datetime-local" name="startTime" required />
              </div>
              <div className="modal-form-group">
                <label htmlFor="endTime">End Time:</label>
                <input type="datetime-local" name="endTime" required />
              </div>
            </>
          )}
          <div className="modal-buttons">
            <button type="submit" className="modal-button save-button">Save</button>
            {!isAddingTask && !isAddingGroup && (
              <button type="button" className="modal-button delete-button" onClick={handleDelete}><FaTrash /> Delete</button>
            )}
            <button type="button" className="modal-button cancel-button" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Scheduler;
