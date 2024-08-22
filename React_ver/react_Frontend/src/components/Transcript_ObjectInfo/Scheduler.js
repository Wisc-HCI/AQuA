//--------------------------------------------------------------------------------------------------------------------------------//
// IMPORT STATEMENTS
//--------------------------------------------------------------------------------------------------------------------------------//

import React, { useState } from 'react';  // React and the useState hook for managing component state.
import Timeline from 'react-calendar-timeline';  // A third-party timeline component for scheduling tasks and events.
import moment from 'moment';  // Moment.js for handling and formatting dates and times.
import Modal from 'react-modal';  // React Modal for handling pop-up forms used for editing/adding tasks or groups.
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';  // FontAwesome icons for user interaction (edit, delete, add).
import 'react-calendar-timeline/lib/Timeline.css';  // Timeline component's default styles.
import '../css/Scheduler.css';  // Custom styles for the Scheduler component.

Modal.setAppElement('#root');  // Sets the root element for the modal to improve accessibility (adjust based on your root element ID).

//--------------------------------------------------------------------------------------------------------------------------------//
// COMPONENT DEFINITION
//--------------------------------------------------------------------------------------------------------------------------------//

// The Scheduler component manages a task timeline where tasks can be edited, added, or removed. 
// Groups represent rows on the timeline, and tasks are visualized as items within those groups.
const Scheduler = ({ groups, items }) => {
  // State to control modal visibility
  const [modalIsOpen, setModalIsOpen] = useState(false);

  // State to track the currently selected task or group for editing
  const [currentTask, setCurrentTask] = useState(null);

  // State to track the currently selected group for editing
  const [currentGroup, setCurrentGroup] = useState(null);

  // State to differentiate between adding and editing modes for tasks and groups
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  //--------------------------------------------------------------------------------------------------------------------------------//
  // MODAL CONTROL FUNCTIONS
  //--------------------------------------------------------------------------------------------------------------------------------//

  // Opens the modal and determines whether it's for a task or a group based on the `taskOrGroup` parameter.
  const openModal = (taskOrGroup) => {
    // Set the current task or group based on the provided object and open the modal.
    setCurrentTask(taskOrGroup && taskOrGroup.type === 'task' ? taskOrGroup : null);
    setCurrentGroup(taskOrGroup && taskOrGroup.type === 'group' ? taskOrGroup : null);
    setModalIsOpen(true);
  };

  // Closes the modal and resets all the relevant states.
  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentTask(null);
    setCurrentGroup(null);
    setIsAddingTask(false);
    setIsAddingGroup(false);
  };

  //--------------------------------------------------------------------------------------------------------------------------------//
  // FORM SUBMISSION AND DELETION HANDLERS
  //--------------------------------------------------------------------------------------------------------------------------------//

  // Handles form submission for editing tasks or groups. The new title is extracted from the form and applied to the current task or group.
  const handleEditSubmit = (e) => {
    e.preventDefault();  // Prevent the form's default submission behavior.
    const newTitle = e.target.elements.title.value;  // Get the new title from the form.

    // Apply the new title to the selected task or group.
    if (currentTask) {
      currentTask.title = newTitle;
    }
    if (currentGroup) {
      currentGroup.title = newTitle;
    }

    closeModal();  // Close the modal once the task/group has been updated.
  };

  // Handles deletion of tasks or groups. This logic would typically be managed in the parent component where state is handled.
  const handleDelete = () => {
    // The actual deletion logic should be implemented in the parent component.
    closeModal();  // Close the modal after the task/group is "deleted".
  };

  //--------------------------------------------------------------------------------------------------------------------------------//
  // ITEM AND GROUP SELECTION HANDLERS
  //--------------------------------------------------------------------------------------------------------------------------------//

  // When a task is selected on the timeline, this handler is called to open the modal for editing the task.
  const handleItemSelect = (itemId) => {
    const task = items.find(item => item.id === itemId);  // Find the task by its ID.
    openModal({ ...task, type: 'task' });  // Open the modal with the task information.
  };

  // When the edit icon for a group is clicked, this handler opens the modal for editing the group.
  const handleGroupEdit = (groupId) => {
    const group = groups.find(group => group.id === groupId);  // Find the group by its ID.
    openModal({ ...group, type: 'group' });  // Open the modal with the group information.
  };

  //--------------------------------------------------------------------------------------------------------------------------------//
  // ADDING NEW TASKS AND GROUPS
  //--------------------------------------------------------------------------------------------------------------------------------//

  // Initiates the process of adding a new task. Opens the modal in "add task" mode and associates it with the selected group.
  const handleAddTask = (groupId) => {
    setIsAddingTask(true);  // Set state to indicate that a new task is being added.
    setCurrentGroup({ id: groupId });  // Set the current group so the new task can be added to it.
    setModalIsOpen(true);  // Open the modal for adding a task.
  };

  // Initiates the process of adding a new group. Opens the modal in "add group" mode.
  const handleAddGroup = () => {
    setIsAddingGroup(true);  // Set state to indicate that a new group is being added.
    setModalIsOpen(true);  // Open the modal for adding a group.
  };

  //--------------------------------------------------------------------------------------------------------------------------------//
  // RENDERING THE COMPONENT
  //--------------------------------------------------------------------------------------------------------------------------------//

  return (
    <div className="scheduler-container">
      <div className="header">
        <h2>Scheduler</h2>  {/* Header title for the component */}
      </div>
      
      {/* Timeline component to display tasks and groups in a calendar format */}
      <Timeline
        groups={groups.map(group => ({
          ...group,
          title: (
            <div className="group-title">
              {group.title}
              <div className="group-icons">
                {/* Edit and Add Task icons for each group */}
                <FaEdit onClick={() => handleGroupEdit(group.id)} className="edit-icon" />
                <FaPlus onClick={() => handleAddTask(group.id)} className="add-task-icon" />
              </div>
            </div>
          )
        }))}
        items={items.map(item => ({
          ...item,
          // Convert moment.js objects to regular JS Date objects for the Timeline component
          start_time: moment(item.start_time).toDate(),
          end_time: moment(item.end_time).toDate()
        }))}
        defaultTimeStart={moment().startOf('day').toDate()}  // Default start time for the timeline view.
        defaultTimeEnd={moment().endOf('day').toDate()}  // Default end time for the timeline view.
        timeSteps={{ second: 15, minute: 1, hour: 1, day: 1, month: 1, year: 1 }}  // Time intervals to control the timeline's resolution.
        timeFormat="HH:mm:ss"  // Format used to display the time on the timeline.
        headerLabelFormats={{  // Customize the header labels.
          time: { long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm:ss' },
          day: { long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm:ss' },
          month: { long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm:ss' },
          year: { long: 'HH:mm:ss', medium: 'HH:mm:ss', short: 'HH:mm:ss' },
        }}
        sidebarContent={<div>Label</div>}  // Sidebar content (can be customized to show additional information).
        canMove={true}  // Allow items to be moved by dragging.
        canResize={"both"}  // Allow items to be resized by dragging either edge.
        
        // Handlers for item movement and resizing (logic handled in the parent component).
        onItemMove={(itemId, dragTime, newGroupOrder) => {
          // Logic for handling item movement should be in the parent component.
        }}
        onItemResize={(itemId, time, edge) => {
          // Logic for handling item resizing should be in the parent component.
        }}
        onItemSelect={handleItemSelect}  // Handle item selection by opening the edit modal.
      />

      {/* Button to add a new group */}
      <div className="add-group-button-container">
        <button onClick={handleAddGroup} className="add-group-button"><FaPlus /> Add Row</button>
      </div>

      {/* Modal for adding/editing tasks or groups */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Edit Task or Group"
        className="modal"
        overlayClassName="overlay"
      >
        <h2 className="modal-title">
          {isAddingTask ? 'Add Task' : isAddingGroup ? 'Add Group' : `Edit ${currentTask ? 'Task' : 'Group'}`}
        </h2>
        
        <form onSubmit={handleEditSubmit} className="modal-form">
          <div className="modal-form-group">
            <label htmlFor="title">Title:</label>
            <input type="text" name="title" defaultValue={currentTask ? currentTask.title : currentGroup ? currentGroup.title : ''} required />
          </div>

          {/* Additional form fields for adding a new task */}
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

          {/* Modal buttons for saving or canceling changes */}
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
