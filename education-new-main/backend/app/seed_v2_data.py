from sqlalchemy.orm import Session
from app.models_v2 import DiagnosticQuizItem

DIAGNOSTIC_SEED_ITEMS = [
    # ================= TOPIC 1: Cell Biology & Energy (7 items) =================
    {
        "id": "diag-bio-1",
        "topic_id": "cell-biology",
        "topic_name": "Cellular Biology & Energy",
        "question_text": "Which organelle is known as the powerhouse of the cell because it generates most of the chemical energy (ATP)?",
        "options": ["Ribosome", "Mitochondria", "Endoplasmic Reticulum", "Golgi Apparatus"],
        "correct_answer": "Mitochondria",
        "difficulty": "easy",
        "explanation": "Mitochondria produce ATP through cellular respiration."
    },
    {
        "id": "diag-bio-2",
        "topic_id": "cell-biology",
        "topic_name": "Cellular Biology & Energy",
        "question_text": "What is the primary function of the semi-permeable cell membrane?",
        "options": ["Regulate what enters and leaves the cell", "Store genetic information", "Synthesize glucose", "Anchor chromosomes"],
        "correct_answer": "Regulate what enters and leaves the cell",
        "difficulty": "easy",
        "explanation": "The phospholipid bilayer selectively controls solute passage."
    },
    {
        "id": "diag-bio-3",
        "topic_id": "cell-biology",
        "topic_name": "Cellular Biology & Energy",
        "question_text": "During photosynthesis, plants convert light energy and carbon dioxide into which carbohydrate?",
        "options": ["Cellulose only", "Glucose", "Lactic Acid", "Glycogen"],
        "correct_answer": "Glucose",
        "difficulty": "medium",
        "explanation": "6CO2 + 6H2O + light -> C6H12O6 + 6O2"
    },
    {
        "id": "diag-bio-4",
        "topic_id": "cell-biology",
        "topic_name": "Cellular Biology & Energy",
        "question_text": "Which process moves substances across a membrane against their concentration gradient using cellular energy?",
        "options": ["Osmosis", "Simple Diffusion", "Active Transport", "Facilitated Diffusion"],
        "correct_answer": "Active Transport",
        "difficulty": "medium",
        "explanation": "Active transport requires ATP pumps to move molecules against concentration gradients."
    },
    {
        "id": "diag-bio-5",
        "topic_id": "cell-biology",
        "topic_name": "Cellular Biology & Energy",
        "question_text": "In cellular respiration, what is the net yield of ATP produced per glucose molecule during Glycolysis alone?",
        "options": ["2 ATP", "4 ATP", "32 ATP", "36 ATP"],
        "correct_answer": "2 ATP",
        "difficulty": "hard",
        "explanation": "Glycolysis consumes 2 ATP and produces 4 ATP, yielding a net 2 ATP."
    },
    {
        "id": "diag-bio-6",
        "topic_id": "cell-biology",
        "topic_name": "Cellular Biology & Energy",
        "question_text": "What role do enzymes play in biochemical reactions within the cell?",
        "options": ["Increase activation energy", "Lower activation energy and accelerate rate", "Act as reactant consumables", "Prevent denaturation"],
        "correct_answer": "Lower activation energy and accelerate rate",
        "difficulty": "medium",
        "explanation": "Enzymes are biological catalysts that lower activation energy."
    },
    {
        "id": "diag-bio-7",
        "topic_id": "cell-biology",
        "topic_name": "Cellular Biology & Energy",
        "question_text": "In the electron transport chain of oxidative phosphorylation, what acts as the final electron acceptor?",
        "options": ["Oxygen", "Carbon Dioxide", "Water", "NAD+"],
        "correct_answer": "Oxygen",
        "difficulty": "hard",
        "explanation": "Oxygen binds with electrons and H+ ions to form water at Complex IV."
    },

    # ================= TOPIC 2: Algebra & Quadratics (6 items) =================
    {
        "id": "diag-alg-1",
        "topic_id": "algebra-quadratics",
        "topic_name": "Algebra & Quadratic Equations",
        "question_text": "What is the standard form of a quadratic equation?",
        "options": ["ax + b = 0", "ax^2 + bx + c = 0", "y = mx + b", "a^2 + b^2 = c^2"],
        "correct_answer": "ax^2 + bx + c = 0",
        "difficulty": "easy",
        "explanation": "The standard quadratic form is ax^2 + bx + c = 0 where a != 0."
    },
    {
        "id": "diag-alg-2",
        "topic_id": "algebra-quadratics",
        "topic_name": "Algebra & Quadratic Equations",
        "question_text": "What are the roots of the equation: x^2 - 9 = 0?",
        "options": ["x = 3 only", "x = -3 and x = 3", "x = 9 and x = -9", "x = 0 and x = 9"],
        "correct_answer": "x = -3 and x = 3",
        "difficulty": "easy",
        "explanation": "(x - 3)(x + 3) = 0 so x = 3, -3."
    },
    {
        "id": "diag-alg-3",
        "topic_id": "algebra-quadratics",
        "topic_name": "Algebra & Quadratic Equations",
        "question_text": "What does the discriminant (b^2 - 4ac) indicate when it is strictly greater than 0?",
        "options": ["Two distinct real roots", "One repeated real root", "Two complex roots", "No solutions"],
        "correct_answer": "Two distinct real roots",
        "difficulty": "medium",
        "explanation": "A positive discriminant yields two real distinct solutions."
    },
    {
        "id": "diag-alg-4",
        "topic_id": "algebra-quadratics",
        "topic_name": "Algebra & Quadratic Equations",
        "question_text": "What is the x-coordinate of the vertex of the parabola defined by y = 2x^2 - 8x + 5?",
        "options": ["x = 2", "x = -2", "x = 4", "x = -4"],
        "correct_answer": "x = 2",
        "difficulty": "medium",
        "explanation": "Vertex x = -b / (2a) = -(-8) / (2 * 2) = 8 / 4 = 2."
    },
    {
        "id": "diag-alg-5",
        "topic_id": "algebra-quadratics",
        "topic_name": "Algebra & Quadratic Equations",
        "question_text": "If the sum of roots of ax^2 + bx + c = 0 is 6 and product is 8, what are the roots?",
        "options": ["2 and 4", "1 and 8", "3 and 3", "-2 and -4"],
        "correct_answer": "2 and 4",
        "difficulty": "hard",
        "explanation": "2 + 4 = 6 and 2 * 4 = 8."
    },
    {
        "id": "diag-alg-6",
        "topic_id": "algebra-quadratics",
        "topic_name": "Algebra & Quadratic Equations",
        "question_text": "Which method involves transforming ax^2 + bx + c into a(x - h)^2 + k?",
        "options": ["Completing the Square", "Synthetic Division", "Rational Root Theorem", "Cramer's Rule"],
        "correct_answer": "Completing the Square",
        "difficulty": "hard",
        "explanation": "Completing the square converts standard form into vertex form."
    }
]


def seed_diagnostic_items(db: Session):
    """Populates diagnostic quiz items if table is empty."""
    existing_count = db.query(DiagnosticQuizItem).count()
    if existing_count == 0:
        for item_data in DIAGNOSTIC_SEED_ITEMS:
            item = DiagnosticQuizItem(**item_data)
            db.add(item)
        db.commit()
