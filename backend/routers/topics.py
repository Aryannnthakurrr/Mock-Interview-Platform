"""
Interview topics router — CRUD and pre-seeded topics.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import InterviewTopic
from schemas import TopicOut

router = APIRouter(prefix="/api/topics", tags=["topics"])

# ── Pre-seeded topics ───────────────────────────────
SEED_TOPICS = [
    {
        "name": "Data Structures & Algorithms",
        "category": "Software Engineering",
        "icon": "🧮",
        "description": "Arrays, linked lists, trees, graphs, sorting, searching, dynamic programming, and complexity analysis.",
        "subtopics": ["Arrays & Strings", "Linked Lists", "Trees & BST", "Graphs", "Dynamic Programming", "Sorting & Searching", "Stacks & Queues", "Hash Tables", "Complexity Analysis"],
    },
    {
        "name": "Object-Oriented Programming",
        "category": "Software Engineering",
        "icon": "🏗️",
        "description": "OOP principles, design patterns, SOLID principles, abstraction, polymorphism, and real-world design.",
        "subtopics": ["Classes & Objects", "Inheritance", "Polymorphism", "Encapsulation", "Abstraction", "SOLID Principles", "Design Patterns", "UML Diagrams"],
    },
    {
        "name": "Database Management (DBMS)",
        "category": "Software Engineering",
        "icon": "🗄️",
        "description": "SQL, normalization, transactions, indexing, query optimization, and database design.",
        "subtopics": ["SQL Queries", "Normalization", "ER Diagrams", "Transactions & ACID", "Indexing", "Joins", "Stored Procedures", "NoSQL vs SQL", "Query Optimization"],
    },
    {
        "name": "Operating Systems",
        "category": "Software Engineering",
        "icon": "⚙️",
        "description": "Process management, memory management, CPU scheduling, deadlocks, and file systems.",
        "subtopics": ["Processes & Threads", "CPU Scheduling", "Memory Management", "Virtual Memory", "Deadlocks", "File Systems", "Synchronization", "Paging & Segmentation"],
    },
    {
        "name": "Computer Networks",
        "category": "Software Engineering",
        "icon": "🌐",
        "description": "OSI model, TCP/IP, HTTP, DNS, routing, subnetting, and network security.",
        "subtopics": ["OSI Model", "TCP/IP", "HTTP/HTTPS", "DNS", "Routing", "Subnetting", "Firewalls", "Load Balancing", "WebSockets"],
    },
    {
        "name": "System Design",
        "category": "Software Engineering",
        "icon": "📐",
        "description": "Scalable system architecture, load balancing, caching, databases, microservices, and distributed systems.",
        "subtopics": ["Scalability", "Load Balancing", "Caching Strategies", "Database Sharding", "Microservices", "Message Queues", "CDN", "API Design", "CAP Theorem"],
    },
    {
        "name": "Python Programming",
        "category": "Programming Languages",
        "icon": "🐍",
        "description": "Python fundamentals, data structures, decorators, generators, async, and best practices.",
        "subtopics": ["Data Types", "List Comprehensions", "Decorators", "Generators", "OOP in Python", "Exception Handling", "Multithreading", "Async/Await", "Testing"],
    },
    {
        "name": "JavaScript & Web",
        "category": "Programming Languages",
        "icon": "🟨",
        "description": "JavaScript fundamentals, async programming, DOM, closures, React, and modern ES6+ features.",
        "subtopics": ["Closures", "Promises & Async/Await", "Event Loop", "Prototypes", "ES6+ Features", "DOM Manipulation", "React Concepts", "TypeScript Basics", "REST APIs"],
    },
    {
        "name": "Machine Learning",
        "category": "Data Science",
        "icon": "🤖",
        "description": "ML algorithms, classification, regression, neural networks, evaluation metrics, and feature engineering.",
        "subtopics": ["Linear Regression", "Logistic Regression", "Decision Trees", "SVM", "Neural Networks", "Overfitting & Regularization", "Feature Engineering", "Model Evaluation", "Ensemble Methods"],
    },
    {
        "name": "Behavioral Interview",
        "category": "Soft Skills",
        "icon": "🤝",
        "description": "Leadership, teamwork, conflict resolution, problem-solving, and STAR method responses.",
        "subtopics": ["Tell Me About Yourself", "Leadership", "Teamwork", "Conflict Resolution", "Failure & Learning", "Problem Solving", "Time Management", "Why This Company"],
    },
]


def seed_topics(db: Session):
    """Seed the database with default interview topics if empty."""
    existing = db.query(InterviewTopic).count()
    if existing > 0:
        return

    for topic_data in SEED_TOPICS:
        topic = InterviewTopic(
            name=topic_data["name"],
            category=topic_data["category"],
            icon=topic_data["icon"],
            description=topic_data["description"],
            subtopics=topic_data["subtopics"],
            system_prompt_template="",
        )
        db.add(topic)
    db.commit()


@router.get("", response_model=list[TopicOut])
def list_topics(db: Session = Depends(get_db)):
    return db.query(InterviewTopic).all()


@router.get("/{topic_id}", response_model=TopicOut)
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(InterviewTopic).filter(InterviewTopic.id == topic_id).first()
    if not topic:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic
