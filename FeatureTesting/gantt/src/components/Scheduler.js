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
    { id: 4, title: 'Book' },
    { id: 5, title: 'Desk' },
    { id: 6, title: 'Smartphone' },
    { id: 7, title: 'Laptop' },
    { id: 8, title: 'Keyboard' },
    { id: 9, title: 'Mouse' },
  ]);

  const [items, setItems] = useState([
    { id: 1, group: 2, title: 'Task #38', start_time: '06:00:00', end_time: '08:00:00', className: 'task-green' },
    { id: 2, group: 2, title: 'Task #99', start_time: '07:00:00', end_time: '09:00:00', className: 'task-blue' },
    { id: 3, group: 3, title: 'Task #40', start_time: '06:30:00', end_time: '10:00:00', className: 'task-light-blue' },
    { id: 4, group: 4, title: 'Task #31', start_time: '08:00:00', end_time: '10:30:00', className: 'task-orange' },
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
      const startTime = e.target.elements.startTime.value + ':00';
      const endTime = e.target.elements.endTime.value + ':00';

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

  const handleAddTask = (groupId) => {
    setIsAddingTask(true);
    setCurrentGroup({ id: groupId });
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
      </div>
      <Timeline
        groups={groups.map(group => ({
          ...group,
          title: (
            <div className="group-title">
              {group.title}
              <div className="group-icons">
                <FaEdit onClick={() => handleGroupEdit(group.id)} className="edit-icon" />
                <FaPlus onClick={() => handleAddTask(group.id)} className="add-task-icon" />
              </div>
            </div>
          )
        }))}
        items={items.map(item => ({
          ...item,
          start_time: moment(item.start_time, 'HH:mm:ss'),
          end_time: moment(item.end_time, 'HH:mm:ss')
        }))}
        defaultTimeStart={moment('05:00:00', 'HH:mm:ss')}
        defaultTimeEnd={moment('17:00:00', 'HH:mm:ss')}
        timeSteps={{ second: 15, minute: 1, hour: 1, day: 1, month: 1, year: 1 }}
        timeFormat="HH:mm:ss"
        headerLabelFormats={{
          time: { long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm:ss' },
          day: { long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm:ss' },
          month: { long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm:ss' },
          year: { long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm:ss' },
        }}
        sidebarContent={<div>Label</div>}
        canMove={true}
        canResize={"both"}
        onItemMove={(itemId, dragTime, newGroupOrder) => {
          const group = groups[newGroupOrder];
          const newItems = items.map(item => 
            item.id === itemId
              ? { ...item, start_time: moment(dragTime).format('HH:mm:ss'), end_time: moment(dragTime).add(moment(item.end_time, 'HH:mm:ss').diff(moment(item.start_time, 'HH:mm:ss'))).format('HH:mm:ss'), group: group.id }
              : item
          );
          setItems(newItems);
        }}
        onItemResize={(itemId, time, edge) => {
          const newItems = items.map(item => 
            item.id === itemId
              ? { ...item, [edge]: moment(time).format('HH:mm:ss') }
              : item
          );
          setItems(newItems);
        }}
        onItemSelect={handleItemSelect}
      />
      <div className="add-group-button-container">
        <button onClick={handleAddGroup} className="add-group-button"><FaPlus /> Add Row</button>
      </div>
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
                <input type="number" name="groupId" defaultValue={currentGroup ? currentGroup.id : ''} required />
              </div>
              <div className="modal-form-group">
                <label htmlFor="startTime">Start Time:</label>
                <input type="time" name="startTime" step="1" required />
              </div>
              <div className="modal-form-group">
                <label htmlFor="endTime">End Time:</label>
                <input type="time" name="endTime" step="1" required />
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
