import { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Calendar,
  List,
  Button,
  Modal,
  Input,
  Checkbox,
  Typography,
  Empty,
  Card,
  Badge,
  message,
  Spin,
} from 'antd';
import { PlusOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './App.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [todos, setTodos] = useState([]);
  const [dateCounts, setDateCounts] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const dateKey = selectedDate.format('YYYY-MM-DD');

  // Fetch todos for selected date
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/todos?date=${dateKey}`);
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      messageApi.error('Failed to load tasks. Is the backend running?');
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  }, [dateKey, messageApi]);

  // Fetch date counts for calendar badges
  const fetchDateCounts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/dates`);
      if (!response.ok) throw new Error('Failed to fetch date counts');
      const data = await response.json();
      setDateCounts(data);
    } catch (error) {
      console.error('Error fetching date counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    fetchDateCounts();
  }, [fetchDateCounts]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) {
      messageApi.warning('Please enter a task description');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newTodoText.trim(),
          date: dateKey,
          completed: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to create todo');

      setNewTodoText('');
      setIsModalOpen(false);
      messageApi.success('Task added successfully');
      fetchTodos();
      fetchDateCounts();
    } catch (error) {
      messageApi.error('Failed to add task');
      console.error('Error creating todo:', error);
    }
  };

  const handleToggleComplete = async (todoId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update todo');

      fetchTodos();
      fetchDateCounts();
    } catch (error) {
      messageApi.error('Failed to update task');
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete todo');

      messageApi.success('Task deleted');
      fetchTodos();
      fetchDateCounts();
    } catch (error) {
      messageApi.error('Failed to delete task');
      console.error('Error deleting todo:', error);
    }
  };

  // Function to render date cells with badges for dates that have todos
  const dateCellRender = (date) => {
    const key = date.format('YYYY-MM-DD');
    const dateInfo = dateCounts[key];

    if (dateInfo && dateInfo.incomplete > 0) {
      return (
        <div className="date-cell-content">
          <Badge count={dateInfo.incomplete} size="small" />
        </div>
      );
    }
    return null;
  };

  return (
    <Layout className="app-layout">
      {contextHolder}
      <Content className="main-content">
        <Card className="todo-card">
          <div className="todo-header">
            <Title level={3}>Tasks for {selectedDate.format('MMMM D, YYYY')}</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Task
            </Button>
          </div>

          {loading ? (
            <div className="loading-container">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </div>
          ) : todos.length === 0 ? (
            <Empty
              description={
                <Text type="secondary">
                  No tasks for this date. Click "Add Task" to create one.
                </Text>
              }
            />
          ) : (
            <List
              className="todo-list"
              dataSource={todos}
              renderItem={(todo) => (
                <List.Item
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteTodo(todo.id)}
                    />,
                  ]}
                >
                  <Checkbox
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo.id, todo.completed)}
                  >
                    <span className={todo.completed ? 'todo-text-completed' : ''}>
                      {todo.text}
                    </span>
                  </Checkbox>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Content>

      <Sider width={350} className="calendar-sider">
        <Card className="calendar-card">
          <Title level={4}>Select Date</Title>
          <Calendar
            fullscreen={false}
            value={selectedDate}
            onSelect={handleDateSelect}
            cellRender={dateCellRender}
          />
        </Card>
      </Sider>

      <Modal
        title={`Add Task for ${selectedDate.format('MMMM D, YYYY')}`}
        open={isModalOpen}
        onOk={handleAddTodo}
        onCancel={() => {
          setIsModalOpen(false);
          setNewTodoText('');
        }}
        okText="Save Task"
        cancelText="Cancel"
      >
        <TextArea
          rows={4}
          placeholder="Enter your task description..."
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onPressEnter={(e) => {
            if (e.ctrlKey || e.metaKey) {
              handleAddTodo();
            }
          }}
        />
        <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
          Press Ctrl+Enter to save quickly
        </Text>
      </Modal>
    </Layout>
  );
}

export default App;
