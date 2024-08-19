//AutoVFX 2024
//Exercise: Movie Rating System


const fs = require('fs');
const path = require('path');

class MovieRatingSystem {
    constructor(movies = null) {
        this.movies = {};
        this.cache = {};
        
        if (movies) {
            this.loadMovies(movies);
        } else {
            this.loadMoviesFromDisk();
        }
    }

    loadMovies(movies) {
        const uuidRegex = /^[0-9a-fA-F]{8}$/; 
        movies.forEach(movie => {
            
            if (!movie.id || !uuidRegex.test(movie.id)) {
                movie.id = this.generateUUID();
            }
    
            const validRatings = movie.ratings.filter(this.isValidRating);
            const invalidRatings = movie.ratings.filter(rating => !this.isValidRating(rating));
    
            if (invalidRatings.length > 0) {
                this.logMessage(`Warning: Invalid ratings removed for movie ${this.colorText(`'${movie.title}'`, 'cyan')} (ID: ${movie.id}): ${invalidRatings.map(rating => this.colorText(rating, 'red')).join(', ')}`, 'yellow');
            }
    
            const totalRatingSum = validRatings.reduce((acc, rating) => acc + rating, 0);
    
            this.movies[movie.id] = {
                ...movie,
                ratings: validRatings,
                totalRatings: validRatings.length,
                totalRatingSum: totalRatingSum,  
                averageRating: this.calculateAverage(validRatings)
            };
        });
    }
    

    loadMoviesFromDisk() {
        const filePath = path.join(__dirname, 'MovieDB.json');
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const movies = JSON.parse(data);
            this.loadMovies(movies);
            this.logMessage('Movies loaded from disk.', 'green');
        } else {
            this.logMessage('No MovieDB.json file found. Starting with an empty movie list.', 'yellow');
        }
    }

    saveMoviesToDisk() {
        const filePath = path.join(__dirname, 'MovieDB.json');
        const data = JSON.stringify(Object.values(this.movies), null, 2);
        fs.writeFileSync(filePath, data, 'utf8');
        this.logMessage('Movies saved to disk.', 'green');
    }

    generateUUID() {
        return Math.random().toString(36).substr(2, 8).toUpperCase(); 
    }

    findMovie(movieId) {
        if (this.cache[movieId]) {
            return this.cache[movieId];
        }
        const movie = this.movies[movieId] || null;
        if (movie) {
            this.cache[movieId] = movie;
        }
        return movie;
    }

    getMovieByPartialId(partialIdOrTitle) {
        const partialLower = partialIdOrTitle.toLowerCase();
        const matchedMovies = Object.values(this.movies).filter(movie =>
            movie.id.toLowerCase().startsWith(partialLower) ||
            movie.title.toLowerCase().includes(partialLower)
        );
        return matchedMovies;
    }
    

    isValidRating(rating) {
        return rating >= 1 && rating <= 5;
    }

    addRating(partialIdOrTitle, rating, headless = false) {
        const matchedMovies = this.getMovieByPartialId(partialIdOrTitle);
    
        if (matchedMovies.length === 0) {
            if (!headless) this.logMessage(`Error: No matches found for '${partialIdOrTitle}'.`, 'red');
            return { error: `No matches found for '${partialIdOrTitle}'.` };
        }
    
        if (matchedMovies.length > 1) {
            if (!headless) {
                this.logMessage(`Multiple matches found for '${partialIdOrTitle}':`, 'yellow');
                matchedMovies.forEach((movie, index) => {
                    this.logMessage(`${index + 1}. '${movie.title}' (ID: ${movie.id})`, 'cyan');
                });
    
                rl.question('Please enter the number of the movie you wish to add a rating for: ', (choice) => {
                    const selectedIndex = parseInt(choice, 10) - 1;
                    if (selectedIndex >= 0 && selectedIndex < matchedMovies.length) {
                        const selectedMovie = matchedMovies[selectedIndex];
                        this.addRatingToMovie(selectedMovie.id, rating, headless);
                    } else {
                        this.logMessage('Invalid selection.', 'red');
                    }
                    showMenu(); 
                });
            }
            return { error: `Multiple matches found for '${partialIdOrTitle}'.` };
        }
    
        
        const movie = matchedMovies[0];
        return this.addRatingToMovie(movie.id, rating, headless);
    }
    
    addRatingToMovie(movieId, rating, headless = false) {
        const movie = this.findMovie(movieId);
        if (!movie) {
            if (!headless) this.logMessage(`Error: Movie with ID ${movieId} not found.`, 'red');
            return { error: `Movie with ID ${movieId} not found.` };
        }
        if (!this.isValidRating(rating)) {
            if (!headless) this.logMessage(`Error: Rating must be between 1 and 5.`, 'red');
            return { error: `Rating must be between 1 and 5.` };
        }
    
        movie.ratings.push(rating);
        movie.totalRatings++;
        movie.totalRatingSum += rating;  
        movie.averageRating = parseFloat((movie.totalRatingSum / movie.totalRatings).toFixed(1));  
    
        if (!headless) {
            this.logMessage(`Rating '${rating}' added to '${movie.title}'`, 'green');
        }
        return { success: `Rating '${rating}' added to '${movie.title}'`, movie };
    }
    
    
    
    addMovie(movieTitle, headless = false) {
        if (!movieTitle.trim()) {
            if (!headless) this.logMessage(`Error: Movie title cannot be empty.`, 'red');
            return { error: "Movie title cannot be empty." };
        }

        const newId = this.generateUUID();
        this.movies[newId] = {
            id: newId,
            title: movieTitle,
            ratings: [],
            totalRatings: 0,
            averageRating: 0
        };

        if (!headless) {
            this.logMessage(`Movie '${movieTitle}' added with ID ${newId}.`, 'green');
        }
        return { success: `Movie '${movieTitle}' added with ID ${newId}.` };
    }

    deleteMovie(partialIdOrTitle, headless = false) {
        const matchedMovies = this.getMovieByPartialId(partialIdOrTitle);
    
        if (matchedMovies.length === 0) {
            if (!headless) {
                this.logMessage(`No matches found for '${partialIdOrTitle}'.`, 'red');
            }
            return { error: `No matches found for '${partialIdOrTitle}'.` };
        }
    
        if (matchedMovies.length === 1) {
            const movie = matchedMovies[0];
            delete this.movies[movie.id];
            if (!headless) {
                this.logMessage(`Movie '${movie.title}' (ID: ${movie.id}) deleted successfully.`, 'green');
            }
            return { success: `Movie '${movie.title}' (ID: ${movie.id}) deleted successfully.` };
        }
    
        
        if (!headless) {
            this.logMessage(`Multiple matches found for '${partialIdOrTitle}':`, 'yellow');
            matchedMovies.forEach((movie, index) => {
                this.logMessage(`${index + 1}. '${movie.title}' (ID: ${movie.id})`, 'cyan');
            });
    
            rl.question('Please enter the number of the movie you wish to delete: ', (choice) => {
                const selectedIndex = parseInt(choice, 10) - 1;
                if (selectedIndex >= 0 && selectedIndex < matchedMovies.length) {
                    const selectedMovie = matchedMovies[selectedIndex];
                    delete this.movies[selectedMovie.id];
                    this.logMessage(`Movie '${selectedMovie.title}' (ID: ${selectedMovie.id}) deleted successfully.`, 'green');
                } else {
                    this.logMessage('Invalid selection. No movie was deleted.', 'red');
                }
                showMenu(); 
            });
        }
    
        return { error: `Multiple matches found for '${partialIdOrTitle}'.` };
    }
    
    
    


    calculateAverage(ratings) {
        if (ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, rating) => acc + rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    getAverageRating(partialIdOrTitle, headless = false) {
        const matchedMovies = this.getMovieByPartialId(partialIdOrTitle);
    
        if (matchedMovies.length === 0) {
            if (!headless) {
                this.logMessage(`No matches found for '${partialIdOrTitle}'.`, 'red');
            }
            return { error: `No matches found for '${partialIdOrTitle}'.` };
        }
    
        if (matchedMovies.length > 1) {
            if (!headless) {
                this.logMessage(`Multiple matches found for '${partialIdOrTitle}':`, 'yellow');
                matchedMovies.forEach((movie, index) => {
                    this.logMessage(`${index + 1}. '${movie.title}' (ID: ${movie.id})`, 'cyan');
                });
    
                rl.question('Please enter the number of the movie you wish to get the average rating for: ', (choice) => {
                    const selectedIndex = parseInt(choice, 10) - 1;
                    if (selectedIndex >= 0 && selectedIndex < matchedMovies.length) {
                        const selectedMovie = matchedMovies[selectedIndex];
                        this.displayAverageRating(selectedMovie, headless);
                    } else {
                        this.logMessage('Invalid selection.', 'red');
                    }
                    showMenu(); 
                });
            }
            return { error: `Multiple matches found for '${partialIdOrTitle}'.` };
        }
    
        
        const movie = matchedMovies[0];
        return this.displayAverageRating(movie, headless);
    }
    
    displayAverageRating(movie, headless) {
        const result = { title: movie.title, rating: movie.averageRating, totalRatings: movie.totalRatings };
        if (!headless) {
            this.logMessage(`Average rating for '${movie.title}' is ${this.colorText(movie.averageRating, 'blue')} based on ${movie.totalRatings} ratings.`);
        }
        return result;
    }
    

    getTopRatedMovie(headless = false) {
        const ratedMovies = Object.values(this.movies).filter(movie => movie.totalRatings > 0);
        if (ratedMovies.length === 0) {
            const error = 'No movies have ratings yet.';
            if (!headless) this.logMessage(error, 'red');
            return { error };
        }
        const topMovie = ratedMovies.reduce((topMovie, currentMovie) => 
            currentMovie.averageRating > topMovie.averageRating ? currentMovie : topMovie
        );
    
        if (!headless) {
            this.logMessage(`Top rated movie is '${topMovie.title}' with an average rating of ${this.colorText(topMovie.averageRating, 'green')} based on ${topMovie.totalRatings} ratings.`);
        }
    
        return { title: topMovie.title, averageRating: topMovie.averageRating, totalRatings: topMovie.totalRatings };
    }
    
    getAllRatings(partialIdOrTitle, headless = false) {
        const matchedMovies = this.getMovieByPartialId(partialIdOrTitle);
    
        if (matchedMovies.length === 0) {
            if (!headless) {
                this.logMessage(`No matches found for '${partialIdOrTitle}'.`, 'red');
            }
            return { error: `No matches found for '${partialIdOrTitle}'.` };
        }
    
        if (matchedMovies.length > 1) {
            if (!headless) {
                this.logMessage(`Multiple matches found for '${partialIdOrTitle}':`, 'yellow');
                matchedMovies.forEach((movie, index) => {
                    this.logMessage(`${index + 1}. '${movie.title}' (ID: ${movie.id})`, 'cyan');
                });
    
                rl.question('Please enter the number of the movie you wish to view ratings for: ', (choice) => {
                    const selectedIndex = parseInt(choice, 10) - 1;
                    if (selectedIndex >= 0 && selectedIndex < matchedMovies.length) {
                        const selectedMovie = matchedMovies[selectedIndex];
                        this.displayMovieRatings(selectedMovie, headless);
                    } else {
                        this.logMessage('Invalid selection.', 'red');
                    }
                    showMenu(); 
                });
            }
            return { error: `Multiple matches found for '${partialIdOrTitle}'.` };
        }
    
        
        const movie = matchedMovies[0];
        return this.displayMovieRatings(movie, headless);
    }
    
    displayMovieRatings(movie, headless) {
        const ratings = movie.ratings.length > 0 
            ? movie.ratings.slice(0, 10).join(', ') + (movie.ratings.length > 10 ? `... (and ${movie.ratings.length - 10} more)` : '')
            : 'None';
    
        if (!headless) {
            this.logMessage(`Ratings for '${movie.title}': ${ratings}`);
        }
        return { title: movie.title, ratings: ratings };
    }
    
    getMovieList(headless = false) {
        const movieList = Object.values(this.movies).map(movie => {
            const displayedRatings = movie.ratings.slice(0, 10).join(', ');
            const moreRatings = movie.ratings.length > 10 ? `... (and ${movie.ratings.length - 10} more)` : '';
            return `${movie.id}: ${this.colorText(movie.title, 'cyan')} (Ratings: ${this.colorText(displayedRatings + moreRatings || 'No ratings', 'yellow')})`;
        }).join('\n');
    
        if (!headless) {
            this.logMessage(movieList);
        }
        return movieList;
    }
    
    logMessage(message, color = 'reset') {
        console.log(this.colorText(message, color));
    }

    colorText(text, color) {
        const colors = {
            reset: "\x1b[0m",
            red: "\x1b[31m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            blue: "\x1b[34m",
            cyan: "\x1b[36m"
        };
        return `${colors[color]}${text}${colors.reset}`;
    }
}




const moviesList = null;
const movieSystem = new MovieRatingSystem(moviesList);

//I was not sure if this was supposed to be a functional App but if not you can stop reading here. If so please feel free. 
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function handleMenu(option) {
    let result;
    switch (option) {
        case '1':
            rl.question('Enter Movie ID and Rating (e.g., 5A2B3DE4 5): ', (answer) => {
                const [partialIdOrTitle, rating] = answer.split(' ');
                result = movieSystem.addRating(partialIdOrTitle, Number(rating));
                displayResult(result);
                showMenu();
            });
            break;
        case '2':
            rl.question('Enter partial Movie ID or Title: ', (partialIdOrTitle) => {
                result = movieSystem.getAverageRating(partialIdOrTitle);
                displayResult(result);
                showMenu();
            });
            break;
        case '3':
            result = movieSystem.getTopRatedMovie();
            displayResult(result);
            showMenu();
            break;
        case '4':
            rl.question('Enter partial Movie ID or Title: ', (partialIdOrTitle) => {
                result = movieSystem.getAllRatings(partialIdOrTitle);
                displayResult(result);
                showMenu();
            });
            break;
        case '5':
            rl.question('Enter new Movie Title: ', (title) => {
                result = movieSystem.addMovie(title);
                displayResult(result);
                showMenu();
            });
            break;
        case '6':
            rl.question('Enter partial Movie ID or Title to delete: ', (partialIdOrTitle) => {
                result = movieSystem.deleteMovie(partialIdOrTitle);
                displayResult(result);
                showMenu();
            });
            break;
        case '7':
            movieSystem.saveMoviesToDisk();
            rl.close();
            break;
        default:
            movieSystem.logMessage('Invalid option, please choose again.', 'red');
            showMenu();
            break;
    }
}



//I was not sure whether or not the objective was a cleanly CLI interface or whether there were trick questions involving signiature like returning an object instead of logging something to the CLI, 
//(From a technical standpoint you would likeley want an object for further use but from a UIX standpoint you would likely not need an object in a case like this.)
//So this is a secondary output which shows object return and type from a back end perspective to compliment the UI perspective which is just text out the CLI.

function displayResult(result) {
    console.log('\n--- Returned ---');
    console.log('Type:', typeof result);
    console.log('Content:', result);
    console.log('----------------------\n');
}

function showMenu() {
    console.log(`
Current Movies:
${movieSystem.getMovieList()}

Choose an option:
1. Add Rating
2. Get Average Rating
3. Get Top Rated Movie
4. Get All Ratings
5. Add a Movie
6. Delete a Movie
7. Exit
`);
    rl.prompt();
}

rl.on('line', handleMenu);

rl.on('close', () => {
    console.log('Exiting movie rating system.');
    process.exit(0);
});

showMenu();


//TESTS
//These tests contain in and out of bounds calls and should run aground the constraints you outlined in your Problem Statement. 
// movieSystem.addRating(1, 5); 
// movieSystem.addRating(10, 4); 
// movieSystem.addRating(1, 6);  
// movieSystem.getAverageRating(0); 
// movieSystem.getAverageRating(2); 
// movieSystem.getAverageRating(10); 
// movieSystem.getTopRatedMovie(); 
// movieSystem.getAllRatings(0); 
// movieSystem.getAllRatings(2); 
// movieSystem.getAllRatings(10); 




// // Scalability Test with Headless Mode
// // Uncomment me if you want to do 40 Million operations to validate the main functionality of the application.
// // This contains no out-of-bounds calls but covers the entire scope in all permutations.
// // Implemented Headless testing, so the CLI doesn't slow us down anymore. 
// // Implemented basic profiling so we get some timeframes.


// const movieIds = Object.keys(movieSystem.movies);
// const errorLog = [];
// let addRatingSuccessCount = 0;
// let getAverageRatingSuccessCount = 0;
// let getAllRatingsSuccessCount = 0;
// let getTopRatedMovieSuccessCount = 0;

// console.time("Total Execution Time");


// console.time("addRating Time");
// for (let i = 0; i < 10000000; i++) {
//     const randomRating = Math.floor(Math.random() * 5) + 1;
//     const randomMovieId = movieIds[Math.floor(Math.random() * movieIds.length)];

//     const addResult = movieSystem.addRating(randomMovieId, randomRating, true);
//     if (addResult && addResult.error) {
//         errorLog.push(`addRating: ${addResult.error}`);
//     } else {
//         addRatingSuccessCount++;
//     }
// }
// console.timeEnd("addRating Time");


// console.time("getAverageRating Time");
// for (let i = 0; i < 10000000; i++) {
//     const randomMovieId = movieIds[Math.floor(Math.random() * movieIds.length)];
//     const avgResult = movieSystem.getAverageRating(randomMovieId, true);
//     if (avgResult && avgResult.error) {
//         errorLog.push(`getAverageRating: ${avgResult.error}`);
//     } else {
//         getAverageRatingSuccessCount++;
//     }
// }
// console.timeEnd("getAverageRating Time");


// console.time("getAllRatings Time");
// for (let i = 0; i < 10000000; i++) {
//     const randomMovieId = movieIds[Math.floor(Math.random() * movieIds.length)];
//     const allRatingsResult = movieSystem.getAllRatings(randomMovieId, true);
//     if (allRatingsResult && allRatingsResult.error) {
//         errorLog.push(`getAllRatings: ${allRatingsResult.error}`);
//     } else {
//         getAllRatingsSuccessCount++;
//     }
// }
// console.timeEnd("getAllRatings Time");


// console.time("getTopRatedMovie Time");
// for (let i = 0; i < 10000000; i++) {
//     const topRatedResult = movieSystem.getTopRatedMovie(true);
//     if (topRatedResult && topRatedResult.error) {
//         errorLog.push(`getTopRatedMovie: ${topRatedResult.error}`);
//     } else {
//         getTopRatedMovieSuccessCount++;
//     }
// }
// console.timeEnd("getTopRatedMovie Time");

// console.timeEnd("Total Execution Time");

// if (errorLog.length > 0) {
//     console.log(`Encountered ${errorLog.length} errors during execution.`);
//     console.log('Errors:', errorLog);
// } else {
//     console.log('Execution completed without errors.');
// }

// console.log(`\nSuccess Counts:`);
// console.log(`addRating: ${addRatingSuccessCount}`);
// console.log(`getAverageRating: ${getAverageRatingSuccessCount}`);
// console.log(`getAllRatings: ${getAllRatingsSuccessCount}`);
// console.log(`getTopRatedMovie: ${getTopRatedMovieSuccessCount}`);


// showMenu();


