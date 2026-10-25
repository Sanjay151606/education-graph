from sqlalchemy.orm import Session
from .models import AssessmentItem

FULL_SEED_ITEMS = [
    # ==================== SECTION A: Reading & Listening ====================
    # 18 Read-Aloud Questions
    {
        "id": "sec-a-ra-1",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 1,
        "prompt_text": "The vibrant flowers bloomed in the garden.",
        "time_limit_seconds": 15,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-ra-2",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 2,
        "prompt_text": "Technology has significantly changed how people communicate today.",
        "time_limit_seconds": 15,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-ra-3",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 3,
        "prompt_text": "The conference will be held next month in the downtown convention center.",
        "time_limit_seconds": 18,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-ra-4",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 4,
        "prompt_text": "Effective communication skills are essential for professional success in any field.",
        "time_limit_seconds": 18,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-ra-5",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 5,
        "prompt_text": "Global warming is becoming a serious concern for scientists and policymakers worldwide.",
        "time_limit_seconds": 18,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-ra-6",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 6,
        "prompt_text": "The company announced a new initiative to promote sustainability and reduce carbon emissions.",
        "time_limit_seconds": 20,
        "difficulty": "medium"
    },
    {
        "id": "sec-a-ra-7",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 7,
        "prompt_text": "Despite the heavy rain, the event continued as planned with enthusiastic participation from attendees.",
        "time_limit_seconds": 20,
        "difficulty": "medium"
    },
    {
        "id": "sec-a-ra-8",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 8,
        "prompt_text": "Artificial intelligence is transforming industries by automating complex tasks and improving efficiency.",
        "time_limit_seconds": 20,
        "difficulty": "medium"
    },
    {
        "id": "sec-a-ra-9",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 9,
        "prompt_text": "The research team discovered groundbreaking evidence that could revolutionize our understanding of climate patterns.",
        "time_limit_seconds": 20,
        "difficulty": "medium"
    },
    {
        "id": "sec-a-ra-10",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 10,
        "prompt_text": "Customer satisfaction remains our top priority, and we continuously strive to exceed expectations through innovative solutions.",
        "time_limit_seconds": 20,
        "difficulty": "medium"
    },
    {
        "id": "sec-a-ra-11",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 11,
        "prompt_text": "The digital transformation has enabled businesses to reach global markets, streamline operations, and enhance customer experiences through data-driven insights.",
        "time_limit_seconds": 20,
        "difficulty": "medium"
    },
    {
        "id": "sec-a-ra-12",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 12,
        "prompt_text": "Educational institutions are adopting new teaching methodologies that emphasize critical thinking, creativity, and collaborative problem-solving skills.",
        "time_limit_seconds": 20,
        "difficulty": "medium"
    },
    {
        "id": "sec-a-ra-13",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 13,
        "prompt_text": "The healthcare industry is experiencing rapid advancements in medical technology, enabling early disease detection and personalized treatment plans for patients.",
        "time_limit_seconds": 20,
        "difficulty": "hard"
    },
    {
        "id": "sec-a-ra-14",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 14,
        "prompt_text": "Sustainable development requires balancing economic growth with environmental protection, ensuring that future generations inherit a healthy planet with abundant natural resources.",
        "time_limit_seconds": 20,
        "difficulty": "hard"
    },
    {
        "id": "sec-a-ra-15",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 15,
        "prompt_text": "Cross-cultural communication plays a vital role in international business, requiring professionals to understand diverse perspectives, customs, and communication styles to build successful partnerships.",
        "time_limit_seconds": 20,
        "difficulty": "hard"
    },
    {
        "id": "sec-a-ra-16",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 16,
        "prompt_text": "The rapid pace of technological innovation presents both opportunities and challenges for organizations, necessitating continuous learning and adaptation to remain competitive in the global marketplace.",
        "time_limit_seconds": 20,
        "difficulty": "hard"
    },
    {
        "id": "sec-a-ra-17",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 17,
        "prompt_text": "Leadership development programs focus on cultivating essential skills such as strategic thinking, emotional intelligence, and effective decision-making, preparing individuals to navigate complex organizational challenges.",
        "time_limit_seconds": 20,
        "difficulty": "hard"
    },
    {
        "id": "sec-a-ra-18",
        "section": "A",
        "item_type": "read_aloud",
        "sequence_index": 18,
        "prompt_text": "The integration of renewable energy sources into existing power grids requires substantial infrastructure investments, policy reforms, and technological innovations to ensure reliable, sustainable electricity supply for growing populations.",
        "time_limit_seconds": 20,
        "difficulty": "hard"
    },
    # 5 Listen and Repeat Questions
    {
        "id": "sec-a-lr-19",
        "section": "A",
        "item_type": "listen_repeat",
        "sequence_index": 19,
        "prompt_text": "The meeting has been rescheduled to Monday morning.",
        "correct_answer": "The meeting has been rescheduled to Monday morning.",
        "time_limit_seconds": 15,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-lr-20",
        "section": "A",
        "item_type": "listen_repeat",
        "sequence_index": 20,
        "prompt_text": "Global warming is becoming a serious concern worldwide.",
        "correct_answer": "Global warming is becoming a serious concern worldwide.",
        "time_limit_seconds": 15,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-lr-21",
        "section": "A",
        "item_type": "listen_repeat",
        "sequence_index": 21,
        "prompt_text": "Please submit your reports by the end of this week.",
        "correct_answer": "Please submit your reports by the end of this week.",
        "time_limit_seconds": 15,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-lr-22",
        "section": "A",
        "item_type": "listen_repeat",
        "sequence_index": 22,
        "prompt_text": "The project deadline has been extended by two weeks.",
        "correct_answer": "The project deadline has been extended by two weeks.",
        "time_limit_seconds": 15,
        "difficulty": "easy"
    },
    {
        "id": "sec-a-lr-23",
        "section": "A",
        "item_type": "listen_repeat",
        "sequence_index": 23,
        "prompt_text": "Customer feedback is essential for improving our services.",
        "correct_answer": "Customer feedback is essential for improving our services.",
        "time_limit_seconds": 15,
        "difficulty": "easy"
    },

    # ==================== SECTION B: Speaking ====================
    {
        "id": "sec-b-topic-1",
        "section": "B",
        "item_type": "speaking_task",
        "sequence_index": 1,
        "prompt_text": "Importance of Healthy Eating",
        "hints": [
            "What does healthy eating mean to you?",
            "How does diet affect physical and mental health?",
            "What are some challenges in maintaining a healthy diet?",
            "What advice would you give to someone starting a healthy eating journey?"
        ],
        "time_limit_seconds": 60,
        "difficulty": "medium"
    },
    {
        "id": "sec-b-topic-2",
        "section": "B",
        "item_type": "speaking_task",
        "sequence_index": 2,
        "prompt_text": "Impact of Technology on Communication",
        "hints": [
            "How has technology changed the way we communicate?",
            "What are the advantages of digital communication?",
            "What are the disadvantages or challenges?",
            "Do you think technology has improved or harmed personal relationships?"
        ],
        "time_limit_seconds": 60,
        "difficulty": "medium"
    },
    {
        "id": "sec-b-topic-3",
        "section": "B",
        "item_type": "speaking_task",
        "sequence_index": 3,
        "prompt_text": "Advantages and Disadvantages of Social Media",
        "hints": [
            "What are the main benefits of social media?",
            "What negative impacts have you observed?",
            "How does social media affect young people?",
            "Should there be more regulation of social media platforms?"
        ],
        "time_limit_seconds": 60,
        "difficulty": "medium"
    },
    {
        "id": "sec-b-topic-4",
        "section": "B",
        "item_type": "speaking_task",
        "sequence_index": 4,
        "prompt_text": "A Memorable Day in Your Life",
        "hints": [
            "When and where did this memorable day occur?",
            "What made this day special or unforgettable?",
            "Who was with you and what did you do?",
            "How did this experience impact you or change your perspective?"
        ],
        "time_limit_seconds": 60,
        "difficulty": "medium"
    },

    # ==================== SECTION C: Grammar ====================
    # 1. Verb Forms (8 questions)
    {
        "id": "sec-c-g-1",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 1,
        "prompt_text": "She ___ to school every day.",
        "options": ["go", "goes", "going", "gone"],
        "correct_answer": "goes",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-2",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 2,
        "prompt_text": "They ___ playing football now.",
        "options": ["is", "are", "was", "were"],
        "correct_answer": "are",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-3",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 3,
        "prompt_text": "He ___ his homework yesterday.",
        "options": ["do", "does", "did", "done"],
        "correct_answer": "did",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-4",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 4,
        "prompt_text": "We ___ to the park tomorrow.",
        "options": ["go", "goes", "will go", "went"],
        "correct_answer": "will go",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-5",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 5,
        "prompt_text": "She ___ a book when I called.",
        "options": ["read", "reads", "was reading", "is reading"],
        "correct_answer": "was reading",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-6",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 6,
        "prompt_text": "They ___ in this city since 2010.",
        "options": ["live", "lives", "have lived", "had lived"],
        "correct_answer": "have lived",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-7",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 7,
        "prompt_text": "The children ___ in the garden.",
        "options": ["play", "plays", "playing", "are playing"],
        "correct_answer": "are playing",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-8",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 8,
        "prompt_text": "He ___ his keys somewhere.",
        "options": ["lose", "loses", "has lost", "losing"],
        "correct_answer": "has lost",
        "difficulty": "medium"
    },
    # 2. Tenses (8 questions)
    {
        "id": "sec-c-g-9",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 9,
        "prompt_text": "I ___ my work by 6 PM yesterday.",
        "options": ["finish", "finished", "had finished", "have finished"],
        "correct_answer": "had finished",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-10",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 10,
        "prompt_text": "She ___ for two hours when I arrived.",
        "options": ["waits", "waited", "has waited", "had been waiting"],
        "correct_answer": "had been waiting",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-11",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 11,
        "prompt_text": "By next year, I ___ my degree.",
        "options": ["complete", "completed", "will complete", "will have completed"],
        "correct_answer": "will have completed",
        "difficulty": "hard"
    },
    {
        "id": "sec-c-g-12",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 12,
        "prompt_text": "They ___ the project next month.",
        "options": ["finish", "finished", "will finish", "have finished"],
        "correct_answer": "will finish",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-13",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 13,
        "prompt_text": "He ___ in this company for five years.",
        "options": ["works", "worked", "has worked", "is working"],
        "correct_answer": "has worked",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-14",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 14,
        "prompt_text": "The train ___ before we reached the station.",
        "options": ["left", "leaves", "had left", "has left"],
        "correct_answer": "had left",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-15",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 15,
        "prompt_text": "I ___ him since last week.",
        "options": ["don't see", "didn't see", "haven't seen", "hadn't seen"],
        "correct_answer": "haven't seen",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-16",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 16,
        "prompt_text": "She ___ her homework when her friend called.",
        "options": ["does", "did", "was doing", "has done"],
        "correct_answer": "was doing",
        "difficulty": "medium"
    },
    # 3. Articles (6 questions)
    {
        "id": "sec-c-g-17",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 17,
        "prompt_text": "He is ___ honest man.",
        "options": ["a", "an", "the", "no article"],
        "correct_answer": "an",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-18",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 18,
        "prompt_text": "___ Himalayas are the highest mountains.",
        "options": ["A", "An", "The", "No article"],
        "correct_answer": "The",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-19",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 19,
        "prompt_text": "She plays ___ piano beautifully.",
        "options": ["a", "an", "the", "no article"],
        "correct_answer": "the",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-20",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 20,
        "prompt_text": "I need ___ information about the course.",
        "options": ["a", "an", "the", "no article"],
        "correct_answer": "no article",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-21",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 21,
        "prompt_text": "He gave me ___ useful advice.",
        "options": ["a", "an", "the", "no article"],
        "correct_answer": "no article",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-22",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 22,
        "prompt_text": "She is ___ best student in the class.",
        "options": ["a", "an", "the", "no article"],
        "correct_answer": "the",
        "difficulty": "easy"
    },
    # 4. Voice Change (6 questions)
    {
        "id": "sec-c-g-23",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 23,
        "prompt_text": 'Active: "They are building a new bridge." Passive:',
        "options": [
            "A new bridge is being built by them.",
            "A new bridge was built by them.",
            "A new bridge is built by them.",
            "A new bridge has been built by them."
        ],
        "correct_answer": "A new bridge is being built by them.",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-24",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 24,
        "prompt_text": 'Active: "She will write a letter." Passive:',
        "options": [
            "A letter will be written by her.",
            "A letter is written by her.",
            "A letter was written by her.",
            "A letter has been written by her."
        ],
        "correct_answer": "A letter will be written by her.",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-25",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 25,
        "prompt_text": 'Passive: "The cake was baked by Mary." Active:',
        "options": [
            "Mary bakes the cake.",
            "Mary baked the cake.",
            "Mary is baking the cake.",
            "Mary has baked the cake."
        ],
        "correct_answer": "Mary baked the cake.",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-26",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 26,
        "prompt_text": 'Active: "The teacher teaches English." Passive:',
        "options": [
            "English is taught by the teacher.",
            "English was taught by the teacher.",
            "English has been taught by the teacher.",
            "English will be taught by the teacher."
        ],
        "correct_answer": "English is taught by the teacher.",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-27",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 27,
        "prompt_text": 'Passive: "The letter has been written by John." Active:',
        "options": [
            "John writes the letter.",
            "John wrote the letter.",
            "John has written the letter.",
            "John will write the letter."
        ],
        "correct_answer": "John has written the letter.",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-28",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 28,
        "prompt_text": 'Active: "They completed the project." Passive:',
        "options": [
            "The project is completed by them.",
            "The project was completed by them.",
            "The project has been completed by them.",
            "The project will be completed by them."
        ],
        "correct_answer": "The project was completed by them.",
        "difficulty": "easy"
    },
    # 5. Mixed Grammar (6 questions)
    {
        "id": "sec-c-g-29",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 29,
        "prompt_text": "She is good ___ mathematics.",
        "options": ["in", "at", "on", "with"],
        "correct_answer": "at",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-30",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 30,
        "prompt_text": "They arrived ___ the airport on time.",
        "options": ["in", "at", "on", "to"],
        "correct_answer": "at",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-31",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 31,
        "prompt_text": "Neither John nor his friends ___ coming.",
        "options": ["is", "are", "was", "were"],
        "correct_answer": "are",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-32",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 32,
        "prompt_text": "The team ___ playing well today.",
        "options": ["is", "are", "was", "were"],
        "correct_answer": "is",
        "difficulty": "easy"
    },
    {
        "id": "sec-c-g-33",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 33,
        "prompt_text": "If I ___ rich, I would travel the world.",
        "options": ["am", "was", "were", "be"],
        "correct_answer": "were",
        "difficulty": "medium"
    },
    {
        "id": "sec-c-g-34",
        "section": "C",
        "item_type": "grammar_mcq",
        "sequence_index": 34,
        "prompt_text": "She speaks English ___ than her brother.",
        "options": ["good", "better", "best", "well"],
        "correct_answer": "better",
        "difficulty": "easy"
    },

    # ==================== SECTION D: Listening Comprehension ====================
    # Passage 1: Climate Change and Global Warming
    {
        "id": "sec-d-p-1",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 1,
        "passage_group_id": "passage-1",
        "prompt_text": "Climate Change and Global Warming\n\nClimate change represents one of the most pressing challenges facing humanity today. Rising global temperatures are causing ice caps to melt, sea levels to rise, and weather patterns to become increasingly unpredictable. Scientists worldwide agree that human activities, particularly the burning of fossil fuels and deforestation, are the primary drivers of this phenomenon. The consequences are far-reaching, affecting ecosystems, agriculture, and human settlements. Immediate action is required to reduce greenhouse gas emissions and transition to renewable energy sources. International cooperation and policy reforms are essential to mitigate the worst effects of climate change and ensure a sustainable future for coming generations.",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-1-q-1",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 2,
        "passage_group_id": "passage-1",
        "prompt_text": "What is the main topic of the passage?",
        "options": ["Technology", "Climate Change", "Agriculture", "Energy"],
        "correct_answer": "Climate Change",
        "difficulty": "easy"
    },
    {
        "id": "sec-d-p-1-q-2",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 3,
        "passage_group_id": "passage-1",
        "prompt_text": "According to the passage, what is the primary cause of climate change?",
        "options": ["Natural disasters", "Human activities", "Solar radiation", "Ocean currents"],
        "correct_answer": "Human activities",
        "difficulty": "easy"
    },
    {
        "id": "sec-d-p-1-q-3",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 4,
        "passage_group_id": "passage-1",
        "prompt_text": "What does the passage suggest is necessary to address climate change?",
        "options": ["More research", "International cooperation", "Population control", "Space exploration"],
        "correct_answer": "International cooperation",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-1-q-4",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 5,
        "passage_group_id": "passage-1",
        "prompt_text": "What is the tone of the passage?",
        "options": ["Humorous", "Urgent and serious", "Optimistic", "Indifferent"],
        "correct_answer": "Urgent and serious",
        "difficulty": "medium"
    },

    # Passage 2: The Digital Revolution in Education
    {
        "id": "sec-d-p-2",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 6,
        "passage_group_id": "passage-2",
        "prompt_text": "The Digital Revolution in Education\n\nThe integration of technology in education has transformed traditional learning methods dramatically. Online platforms, virtual classrooms, and digital resources have made education more accessible to students worldwide. During the recent pandemic, educational institutions rapidly adopted remote learning technologies, demonstrating the resilience and adaptability of the education sector. However, this digital shift has also highlighted the digital divide, where students without access to technology or reliable internet face significant disadvantages. Educators are now exploring hybrid models that combine the best of both traditional and digital approaches. The future of education lies in leveraging technology while ensuring equitable access for all learners.",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-2-q-5",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 7,
        "passage_group_id": "passage-2",
        "prompt_text": "What is the main focus of this passage?",
        "options": ["Pandemic response", "Technology in education", "Internet access", "Teacher training"],
        "correct_answer": "Technology in education",
        "difficulty": "easy"
    },
    {
        "id": "sec-d-p-2-q-6",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 8,
        "passage_group_id": "passage-2",
        "prompt_text": "What problem does the speaker highlight?",
        "options": ["Lack of teachers", "Digital divide", "High costs", "Poor infrastructure"],
        "correct_answer": "Digital divide",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-2-q-7",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 9,
        "passage_group_id": "passage-2",
        "prompt_text": "According to the passage, what did the pandemic demonstrate?",
        "options": ["Education is unnecessary", "Technology is expensive", "Education sector adaptability", "Students prefer online learning"],
        "correct_answer": "Education sector adaptability",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-2-q-8",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 10,
        "passage_group_id": "passage-2",
        "prompt_text": "What does the passage suggest about the future of education?",
        "options": ["Fully online", "Traditional only", "Hybrid approach", "Uncertain"],
        "correct_answer": "Hybrid approach",
        "difficulty": "medium"
    },

    # Passage 3: The Importance of Mental Health Awareness
    {
        "id": "sec-d-p-3",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 11,
        "passage_group_id": "passage-3",
        "prompt_text": "The Importance of Mental Health Awareness\n\nMental health has emerged as a critical public health concern in recent years. The stigma surrounding mental illness is gradually diminishing as more people speak openly about their experiences. Workplace stress, social media pressure, and the fast-paced modern lifestyle contribute significantly to mental health challenges. Organizations are increasingly recognizing the importance of employee well-being and implementing mental health support programs. Early intervention and access to professional help can make a substantial difference in treatment outcomes. Public awareness campaigns and education are essential to normalize conversations about mental health and encourage people to seek help without fear of judgment.",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-3-q-9",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 12,
        "passage_group_id": "passage-3",
        "prompt_text": "What is the central theme of the passage?",
        "options": ["Workplace productivity", "Mental health awareness", "Social media effects", "Healthcare systems"],
        "correct_answer": "Mental health awareness",
        "difficulty": "easy"
    },
    {
        "id": "sec-d-p-3-q-10",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 13,
        "passage_group_id": "passage-3",
        "prompt_text": "What change does the passage mention regarding mental health?",
        "options": ["Increasing stigma", "Decreasing stigma", "No change", "More confusion"],
        "correct_answer": "Decreasing stigma",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-3-q-11",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 14,
        "passage_group_id": "passage-3",
        "prompt_text": "What are organizations doing according to the passage?",
        "options": ["Ignoring the issue", "Implementing support programs", "Reducing workload", "Hiring more staff"],
        "correct_answer": "Implementing support programs",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-3-q-12",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 15,
        "passage_group_id": "passage-3",
        "prompt_text": "What does the passage emphasize as important?",
        "options": ["Medication only", "Early intervention", "Isolation", "Self-treatment"],
        "correct_answer": "Early intervention",
        "difficulty": "medium"
    },

    # Passage 4: Sustainable Business Practices
    {
        "id": "sec-d-p-4",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 16,
        "passage_group_id": "passage-4",
        "prompt_text": "Sustainable Business Practices\n\nModern businesses are increasingly adopting sustainable practices to reduce their environmental impact and meet consumer expectations. Corporate social responsibility has evolved from a marketing strategy to a core business principle. Companies are investing in renewable energy, reducing waste, and implementing circular economy models. Consumers, particularly younger generations, are making purchasing decisions based on a company's environmental and social commitments. This shift is driving innovation in product design, supply chain management, and business operations. While sustainability initiatives may require initial investments, they often lead to long-term cost savings and enhanced brand reputation. The transition to sustainable business practices is not just ethically important but also economically advantageous.",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-4-q-13",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 17,
        "passage_group_id": "passage-4",
        "prompt_text": "What is the main subject of the passage?",
        "options": ["Marketing strategies", "Sustainable business practices", "Consumer behavior", "Product design"],
        "correct_answer": "Sustainable business practices",
        "difficulty": "easy"
    },
    {
        "id": "sec-d-p-4-q-14",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 18,
        "passage_group_id": "passage-4",
        "prompt_text": "How has corporate social responsibility changed?",
        "options": ["Become less important", "Evolved to core principle", "Remained the same", "Been abandoned"],
        "correct_answer": "Evolved to core principle",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-4-q-15",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 19,
        "passage_group_id": "passage-4",
        "prompt_text": "What influences consumer purchasing decisions according to the passage?",
        "options": ["Price only", "Brand name", "Environmental commitments", "Advertising"],
        "correct_answer": "Environmental commitments",
        "difficulty": "medium"
    },
    {
        "id": "sec-d-p-4-q-16",
        "section": "D",
        "item_type": "listening_comprehension",
        "sequence_index": 20,
        "passage_group_id": "passage-4",
        "prompt_text": "What does the passage conclude about sustainability?",
        "options": ["Too expensive", "Ethically and economically beneficial", "Only for large companies", "Temporary trend"],
        "correct_answer": "Ethically and economically beneficial",
        "difficulty": "medium"
    }
]


def seed_full_assessment(db: Session):
    """Idempotently seeds all assessment items verbatim from the reference suite."""
    for item_data in FULL_SEED_ITEMS:
        existing = db.query(AssessmentItem).filter(AssessmentItem.id == item_data["id"]).first()
        if not existing:
            item = AssessmentItem(
                id=item_data["id"],
                section=item_data["section"],
                item_type=item_data["item_type"],
                sequence_index=item_data["sequence_index"],
                prompt_text=item_data["prompt_text"],
                options=item_data.get("options"),
                correct_answer=item_data.get("correct_answer"),
                hints=item_data.get("hints"),
                time_limit_seconds=item_data.get("time_limit_seconds"),
                passage_group_id=item_data.get("passage_group_id"),
                difficulty=item_data.get("difficulty")
            )
            db.add(item)
        else:
            # Update existing to ensure exact match
            existing.section = item_data["section"]
            existing.item_type = item_data["item_type"]
            existing.sequence_index = item_data["sequence_index"]
            existing.prompt_text = item_data["prompt_text"]
            existing.options = item_data.get("options")
            existing.correct_answer = item_data.get("correct_answer")
            existing.hints = item_data.get("hints")
            existing.time_limit_seconds = item_data.get("time_limit_seconds")
            existing.passage_group_id = item_data.get("passage_group_id")
            existing.difficulty = item_data.get("difficulty")
    db.commit()
