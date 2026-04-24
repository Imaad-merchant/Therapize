require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { authMiddleware } = require('./middleware/auth')
const chatRoutes = require('./routes/chat')
const insightsRoutes = require('./routes/insights')
const onboardingRoutes = require('./routes/onboarding')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please wait a moment.' },
})

app.use('/api/chat', chatLimiter, authMiddleware, chatRoutes)
app.use('/api/insights', authMiddleware, insightsRoutes)
app.use('/api/onboarding', authMiddleware, onboardingRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Therapy API server running on port ${PORT}`)
})
