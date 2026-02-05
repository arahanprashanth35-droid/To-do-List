from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# SQLite Configuration - database file stored in the same directory
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "todos.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# Todo Model
class Todo(db.Model):
    __tablename__ = 'todos'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    text = db.Column(db.String(500), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'completed': self.completed,
            'date': self.date.isoformat(),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


# Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'})


@app.route('/api/todos', methods=['GET'])
def get_todos():
    """Get all todos, optionally filtered by date"""
    date_param = request.args.get('date')

    if date_param:
        try:
            filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            todos = Todo.query.filter_by(date=filter_date).order_by(Todo.created_at.desc()).all()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        todos = Todo.query.order_by(Todo.date.desc(), Todo.created_at.desc()).all()

    return jsonify([todo.to_dict() for todo in todos])


@app.route('/api/todos', methods=['POST'])
def create_todo():
    """Create a new todo"""
    data = request.get_json()

    if not data or 'text' not in data or 'date' not in data:
        return jsonify({'error': 'Text and date are required'}), 400

    try:
        todo_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    todo = Todo(
        text=data['text'].strip(),
        date=todo_date,
        completed=data.get('completed', False)
    )

    db.session.add(todo)
    db.session.commit()

    return jsonify(todo.to_dict()), 201


@app.route('/api/todos/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    """Get a specific todo by ID"""
    todo = Todo.query.get_or_404(todo_id)
    return jsonify(todo.to_dict())


@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """Update a todo"""
    todo = Todo.query.get_or_404(todo_id)
    data = request.get_json()

    if 'text' in data:
        todo.text = data['text'].strip()

    if 'completed' in data:
        todo.completed = data['completed']

    if 'date' in data:
        try:
            todo.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    db.session.commit()

    return jsonify(todo.to_dict())


@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """Delete a todo"""
    todo = Todo.query.get_or_404(todo_id)
    db.session.delete(todo)
    db.session.commit()

    return jsonify({'message': 'Todo deleted successfully'})


@app.route('/api/todos/dates', methods=['GET'])
def get_dates_with_todos():
    """Get all dates that have todos with their incomplete counts"""
    results = db.session.query(
        Todo.date,
        db.func.count(Todo.id).label('total'),
        db.func.sum(db.case((Todo.completed == False, 1), else_=0)).label('incomplete')
    ).group_by(Todo.date).all()

    return jsonify({
        result.date.isoformat(): {
            'total': result.total,
            'incomplete': int(result.incomplete or 0)
        }
        for result in results
    })


# Initialize database
def init_db():
    """Create database tables"""
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")


if __name__ == '__main__':
    init_db()
    print("Starting To-Do List Backend on http://localhost:5000")
    app.run(debug=True, port=5000)
