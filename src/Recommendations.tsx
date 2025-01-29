import { useState, useEffect } from 'react'
    import { useLocation, useNavigate } from 'react-router-dom'
    import moviesData from './MovieData'
    import genresMapData from './data/genresMap.json'

    export default function Recommendations() {
      const location = useLocation()
      const navigate = useNavigate()
      const previousResults = location.state?.previousResults || []
      const [showMovies, setShowMovies] = useState(false)
      const [isLoading, setIsLoading] = useState(true)
      const [movies, setMovies] = useState<typeof moviesData>([])
      const [genresMap, setGenresMap] = useState<typeof genresMapData>([])
      const [selectedLanguage, setSelectedLanguage] = useState('any')

      useEffect(() => {
        const loadData = async () => {
          try {
            setMovies(moviesData)
            setGenresMap(genresMapData)
          } catch (error) {
            console.error('Error loading data:', error)
          } finally {
            setIsLoading(false)
          }
        }

        loadData()
      }, [])

      const allGenres = previousResults.reduce((acc, result) => {
        const matchingEntry = genresMap.find(
          entry => entry.Answer_Combination === result
        )
        if (matchingEntry) {
          matchingEntry.Top_Genres.forEach(genre => acc.add(genre))
        }
        return acc
      }, new Set<string>())

      const uniqueGenres = Array.from(allGenres)

      const getRecommendedMovies = () => {
        const movieScores = movies.map(movie => {
          let movieGenres: string[] = []
          let movieLanguages: string[] = []

          try {
            movieGenres = JSON.parse(movie.genres.replace(/'/g, '"'))
            movieLanguages = JSON.parse(movie.Languages.replace(/'/g, '"'))
          } catch (error) {
            console.error('Error parsing data for movie:', {
              title: movie.Title,
              genres: movie.genres,
              languages: movie.Languages,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            movieGenres = []
            movieLanguages = []
          }

          const score = uniqueGenres.reduce((acc, genre) =>
            movieGenres.includes(genre) ? acc + 1 : acc, 0)
          return { ...movie, score, movieLanguages }
        })

        let filteredMovies = movieScores;
        if (selectedLanguage !== 'any') {
          filteredMovies = movieScores.filter(movie =>
            movie.movieLanguages.includes(selectedLanguage)
          );
        }

        return filteredMovies
          .sort((a, b) => b.score - a.score || parseFloat(b.Rating) - parseFloat(a.Rating))
          .slice(0, 10)
      }

      const recommendedMovies = getRecommendedMovies()

      const allLanguages = Array.from(new Set(movies.reduce((acc, movie) => {
        try {
          const languages = JSON.parse(movie.Languages.replace(/'/g, '"'))
          languages.forEach((lang: string) => acc.add(lang))
        } catch (error) {
          console.error('Error parsing languages for movie:', {
            title: movie.Title,
            languages: movie.Languages,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        return acc
      }, new Set<string>())))

      const sortedLanguages = ['any', 'English', ...allLanguages.filter(lang => lang !== 'English').sort()]

      const handleBackToQuiz = () => {
        navigate('/')
      }

      if (isLoading) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
            <div className="container mx-auto px-4 py-12">
              <div className="max-w-4xl mx-auto text-center">
                <div className="animate-pulse">
                  <div className="w-16 h-16 mx-auto bg-pink-400 rounded-full mb-4" />
                  <p className="text-xl text-gray-300">Loading recommendations...</p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      if (showMovies) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
            <div className="container mx-auto px-4 py-12">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">
                      <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                        Top 10 Movie Recommendations
                      </span>
                    </h1>
                    <div className="flex items-center gap-2">
                      <label htmlFor="language-filter" className="text-gray-300 text-sm">Filter by Language:</label>
                      <select
                        id="language-filter"
                        className="bg-white/10 text-white rounded-md p-2 text-sm"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                      >
                        {sortedLanguages.map((lang) => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {recommendedMovies.map((movie, index) => (
                      <div key={index} className="bg-white/5 p-6 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-2xl font-bold mb-2">
                              {movie.Title} ({movie.Year})
                            </h2>
                            <div className="text-pink-400 mb-2">
                              Rating: {movie.Rating} | Match Score: {movie.score}
                            </div>
                            <div className="text-gray-300 mb-4">
                              Genres: {JSON.parse(movie.genres.replace(/'/g, '"')).join(', ')}
                            </div>
                            <div className="text-sm text-gray-400">
                              Languages: {JSON.parse(movie.Languages.replace(/'/g, '"')).join(', ')}
                            </div>
                          </div>
                          <a
                            href={movie.Movie_Link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap"
                          >
                            View on IMDB
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleBackToQuiz}
                    className="mt-8 w-full bg-purple-500 hover:bg-purple-600 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Take another Movie Quiz!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl">
                <h1 className="text-3xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                    Quiz Results & Recommendations
                  </span>
                </h1>

                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">
                    Top Genres Based on Group Preferences:
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {uniqueGenres.map((genre, index) => (
                      <div key={index} className="bg-pink-500/20 px-4 py-2 rounded-full text-sm">
                        {genre}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  {previousResults.map((result, index) => {
                    const matchingEntry = genresMap.find(
                      entry => entry.Answer_Combination === result
                    )
                    const viewerGenres = matchingEntry ? matchingEntry.Top_Genres : []

                    return (
                      <div key={index} className="bg-white/5 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">
                          Viewer {index + 1} Movie Quiz Results:
                        </h3>
                        <div className="text-sm text-gray-400">
                          Preferred Genres: {viewerGenres.join(', ')}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => setShowMovies(true)}
                  className="mt-8 w-full bg-pink-500 hover:bg-pink-600 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Show Movie Recommendations
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
