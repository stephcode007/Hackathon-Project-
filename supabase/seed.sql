-- Stacks: seed data (mock). Safe to re-run: clears and reloads.
-- Books: placeholder catalogue until Jack's mock data sheet is ready.
-- Rooms, desks, laptops and bookings are added with the booking feature.
-- Covers: https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg

truncate book_holds, books;  -- book_holds (003) references books, so clear both

insert into books (title, author, isbn, subject, floor, shelf, copies_total, copies_available) values
-- Computer science (floor 3)
('Clean Code', 'Robert C. Martin', '9780132350884', 'Software engineering', 3, 'QA76.76 .D47 M37', 3, 2),
('Clean Architecture', 'Robert C. Martin', '9780134494166', 'Software engineering', 3, 'QA76.76 .D47 M373', 2, 1),
('The Pragmatic Programmer', 'David Thomas, Andrew Hunt', '9780135957059', 'Software engineering', 3, 'QA76.6 .H857', 3, 3),
('Refactoring', 'Martin Fowler', '9780134757599', 'Software engineering', 3, 'QA76.76 .R42 F69', 2, 0),
('Code Complete', 'Steve McConnell', '9780735619678', 'Software engineering', 3, 'QA76.76 .D47 M39', 2, 2),
('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', '9780201633610', 'Software engineering', 3, 'QA76.64 .D47', 2, 1),
('Head First Design Patterns', 'Eric Freeman, Elisabeth Robson', '9780596007126', 'Software engineering', 3, 'QA76.64 .F74', 2, 2),
('The Mythical Man-Month', 'Frederick P. Brooks Jr.', '9780201835953', 'Software engineering', 3, 'QA76.758 .B75', 1, 1),
('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', '9780262033848', 'Algorithms', 3, 'QA76.6 .C662', 5, 1),
('Grokking Algorithms', 'Aditya Bhargava', '9781617292231', 'Algorithms', 3, 'QA76.9 .A43 B43', 3, 3),
('Cracking the Coding Interview', 'Gayle Laakmann McDowell', '9780984782857', 'Careers in computing', 3, 'QA76.25 .M33', 4, 0),
('The Art of Computer Programming, Vol. 1', 'Donald E. Knuth', '9780201896831', 'Algorithms', 3, 'QA76.6 .K64', 1, 1),
('Structure and Interpretation of Computer Programs', 'Harold Abelson, Gerald Jay Sussman', '9780262510875', 'Programming languages', 3, 'QA76.6 .A255', 2, 2),
('The C Programming Language', 'Brian W. Kernighan, Dennis M. Ritchie', '9780131103627', 'Programming languages', 3, 'QA76.73 .C15 K47', 2, 1),
('Eloquent JavaScript', 'Marijn Haverbeke', '9781593279509', 'Programming languages', 3, 'QA76.73 .J39 H38', 2, 2),
('JavaScript: The Good Parts', 'Douglas Crockford', '9780596517748', 'Programming languages', 3, 'QA76.73 .J39 C76', 1, 1),
('Python Crash Course', 'Eric Matthes', '9781593279288', 'Programming languages', 3, 'QA76.73 .P98 M38', 4, 2),
('Automate the Boring Stuff with Python', 'Al Sweigart', '9781593279929', 'Programming languages', 3, 'QA76.73 .P98 S94', 2, 2),
('Compilers: Principles, Techniques, and Tools', 'Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman', '9780321486813', 'Programming languages', 3, 'QA76.76 .C65 A37', 1, 1),
('Computer Systems: A Programmer''s Perspective', 'Randal E. Bryant, David R. O''Hallaron', '9780134092669', 'Computer systems', 3, 'QA76.5 .B795', 2, 1),
('Operating System Concepts', 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', '9781118063330', 'Computer systems', 3, 'QA76.76 .O63 S55', 3, 2),
('Computer Networking: A Top-Down Approach', 'James F. Kurose, Keith W. Ross', '9780133594140', 'Computer systems', 3, 'TK5105.875 .I57 K88', 3, 3),
('Database System Concepts', 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', '9780078022159', 'Databases', 3, 'QA76.9 .D3 S5637', 2, 2),
('Designing Data-Intensive Applications', 'Martin Kleppmann', '9781449373320', 'Databases', 3, 'QA76.9 .D35 K54', 2, 0),
('Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', '9780134610993', 'Artificial intelligence', 3, 'Q335 .R86', 4, 2),
('Deep Learning', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', '9780262035613', 'Artificial intelligence', 3, 'Q325.5 .G66', 2, 1),
('Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', 'Aurélien Géron', '9781492032649', 'Artificial intelligence', 3, 'Q325.5 .G47', 3, 2),
('Pattern Recognition and Machine Learning', 'Christopher M. Bishop', '9780387310732', 'Artificial intelligence', 3, 'Q327 .B52', 1, 1),
('Gödel, Escher, Bach', 'Douglas R. Hofstadter', '9780465026562', 'Artificial intelligence', 3, 'QA9.8 .H63', 1, 1),
('Don''t Make Me Think, Revisited', 'Steve Krug', '9780321965516', 'User experience design', 3, 'TK5105.888 .K78', 2, 2),
('The Design of Everyday Things', 'Don Norman', '9780465050659', 'User experience design', 3, 'TS171.4 .N67', 2, 1),
-- Maths and science (floor 2)
('Calculus: Early Transcendentals', 'James Stewart', '9781285741550', 'Mathematics', 2, 'QA303.2 .S7346', 6, 3),
('Introduction to Linear Algebra', 'Gilbert Strang', '9780980232776', 'Mathematics', 2, 'QA184.2 .S77', 3, 2),
('Linear Algebra Done Right', 'Sheldon Axler', '9783319110790', 'Mathematics', 2, 'QA184.2 .A96', 2, 2),
('How to Lie with Statistics', 'Darrell Huff', '9780393310726', 'Statistics', 2, 'HA29 .H82', 2, 2),
('Naked Statistics', 'Charles Wheelan', '9780393347777', 'Statistics', 2, 'QA276.12 .W45', 2, 1),
('A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Physics', 2, 'QB981 .H377', 2, 2),
('The Feynman Lectures on Physics, Vol. 1', 'Richard P. Feynman, Robert B. Leighton, Matthew Sands', '9780465024933', 'Physics', 2, 'QC23 .F47', 2, 1),
('Cosmos', 'Carl Sagan', '9780345539434', 'Astronomy', 2, 'QB44.2 .S235', 1, 1),
('Campbell Biology', 'Lisa A. Urry, Michael L. Cain, Steven A. Wasserman, Peter V. Minorsky, Jane B. Reece', '9780134093413', 'Biology', 2, 'QH308.2 .C34', 5, 2),
('The Selfish Gene', 'Richard Dawkins', '9780199291151', 'Biology', 2, 'QH375 .D38', 2, 2),
('The Gene: An Intimate History', 'Siddhartha Mukherjee', '9781476733524', 'Biology', 2, 'QH447 .M85', 1, 0),
('The Immortal Life of Henrietta Lacks', 'Rebecca Skloot', '9781400052189', 'Biology', 2, 'RC265.6 .L24 S55', 2, 2),
('Silent Spring', 'Rachel Carson', '9780618249060', 'Environmental science', 2, 'QH545 .P4 C38', 1, 1),
('The Structure of Scientific Revolutions', 'Thomas S. Kuhn', '9780226458120', 'Philosophy of science', 2, 'Q175 .K95', 1, 1),
-- Social sciences, business and philosophy (floor 1)
('Thinking, Fast and Slow', 'Daniel Kahneman', '9780374533557', 'Psychology', 1, 'BF441 .K238', 3, 1),
('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '9780062316097', 'History', 1, 'GN281 .H3713', 3, 2),
('Guns, Germs, and Steel', 'Jared Diamond', '9780393317558', 'History', 1, 'HM206 .D48', 2, 2),
('Freakonomics', 'Steven D. Levitt, Stephen J. Dubner', '9780060731335', 'Economics', 1, 'HB74 .P8 L479', 2, 1),
('Capital in the Twenty-First Century', 'Thomas Piketty', '9780674430006', 'Economics', 1, 'HB501 .P43613', 1, 1),
('The Lean Startup', 'Eric Ries', '9780307887894', 'Business', 1, 'HD62.5 .R545', 2, 2),
('Zero to One', 'Peter Thiel, Blake Masters', '9780804139298', 'Business', 1, 'HD62.5 .T525', 2, 1),
('Atomic Habits', 'James Clear', '9780735211292', 'Self-help', 1, 'BF335 .C54', 3, 0),
('Deep Work', 'Cal Newport', '9781455586691', 'Self-help', 1, 'BF323 .D5 N49', 2, 2),
('The Republic', 'Plato', '9780140455113', 'Philosophy', 1, 'JC71 .P35', 2, 2),
('Meditations', 'Marcus Aurelius', '9780812968255', 'Philosophy', 1, 'B580 .H39', 2, 1),
('On Writing', 'Stephen King', '9781439156810', 'Writing', 1, 'PS3561 .I483 Z475', 2, 2),
('The Elements of Style', 'William Strunk Jr., E. B. White', '9780205309023', 'Writing', 1, 'PE1408 .S772', 3, 3),
-- Literature (floor 4)
('Nineteen Eighty-Four', 'George Orwell', '9780451524935', 'Fiction', 4, 'PR6029 .R8 N49', 3, 1),
('Brave New World', 'Aldous Huxley', '9780060850524', 'Fiction', 4, 'PR6015 .U9 B6', 2, 2),
('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Fiction', 4, 'PS3562 .E353 T6', 3, 3),
('Pride and Prejudice', 'Jane Austen', '9780141439518', 'Fiction', 4, 'PR4034 .P7', 2, 1),
('Frankenstein', 'Mary Shelley', '9780141439471', 'Fiction', 4, 'PR5397 .F7', 2, 2),
('Jane Eyre', 'Charlotte Brontë', '9780141441146', 'Fiction', 4, 'PR4167 .J3', 2, 2),
('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 4, 'PS3511 .I9 G7', 3, 2),
('Things Fall Apart', 'Chinua Achebe', '9780385474542', 'Fiction', 4, 'PR9387.9 .A3 T5', 3, 2),
('Beloved', 'Toni Morrison', '9781400033416', 'Fiction', 4, 'PS3563 .O8749 B4', 2, 0),
('One Hundred Years of Solitude', 'Gabriel García Márquez', '9780060883287', 'Fiction', 4, 'PQ8180.17 .A73 C513', 2, 1),
('Crime and Punishment', 'Fyodor Dostoevsky', '9780679734505', 'Fiction', 4, 'PG3326 .P7', 2, 2),
('The Catcher in the Rye', 'J. D. Salinger', '9780316769488', 'Fiction', 4, 'PS3537 .A426 C3', 2, 1),
('Educated', 'Tara Westover', '9780399590504', 'Biography', 4, 'CT275 .W43', 2, 1),
('Becoming', 'Michelle Obama', '9781524763138', 'Biography', 4, 'E909 .O24', 2, 2);

-- When the next copy of each fully-loaned book is due back (used by the reservations waiting list)
update books
set next_due_back = current_date + 2 + (abs(hashtext(title)) % 10)
where copies_available = 0;
