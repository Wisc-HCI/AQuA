import React, { useState } from 'react';
import Timeline from 'react-calendar-timeline';
import moment from 'moment';
import Modal from 'react-modal';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import 'react-calendar-timeline/lib/Timeline.css';
import '../css/Scheduler.css';

Modal.setAppElement('#root'); // Adjust if your root element ID is different

const Scheduler = ({ groups, items }) => {
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

    if (currentTask) {
      currentTask.title = newTitle;
    }

    if (currentGroup) {
      currentGroup.title = newTitle;
    }

    closeModal();
  };

  const handleDelete = () => {
    // The deleting logic needs to be handled in the App component where state is managed
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
          start_time: moment(item.start_time).toDate(),
          end_time: moment(item.end_time).toDate()
        }))}
        defaultTimeStart={moment().startOf('day').toDate()}
        defaultTimeEnd={moment().endOf('day').toDate()}
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
          // The moving logic needs to be handled in the App component where state is managed
        }}
        onItemResize={(itemId, time, edge) => {
          // The resizing logic needs to be handled in the App component where state is managed
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
