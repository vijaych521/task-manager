const User = require('../models/userModel')
const express = require('express')
const auth = require('../middleware/auth.js')

const router = new express.Router

router.post('/users/login', async (request, response) => {
    try {
        const user = await User.findByUserCredentials(request.body.email, request.body.password)
        const token = await user.generateAuthToken() // call on user instance
        // response.send({ 'user': user.getPublicProfile(), token })
        response.send({ user, token }) // here user object internally calls userSchema.methods.toJSON function
    } catch (error) {
        response.status(404).send(error.message)
    }
})

router.get('/users', async (request, response) => {
    try {
        response.send(await User.find({}))
    } catch (errors) {
        response.status(500).send(errors)
    }
})

// get user profile
router.get('/users/me', auth, async (request, response) => {
    response.send(request.user) // here user object internally calls userSchema.methods.toJSON function
})

// create user request
router.post('/users', async (request, response) => {
    const user = new User(request.body)
    try {
        const savedUser = await user.save()
        const token = await user.generateAuthToken()
        response.status(201).send({ savedUser, token })
    } catch (error) {
        response.status(400)
        response.send(error)
    }
})

// get user by id
router.get('/users/:id', async (request, response) => {
    const _id = request.params.id
    try {
        const user = await User.findById(_id)
        if (!user) {
            // return response.status(404).send("User Not found with given id: " + _id)
            await Promise.reject(new Error("Task not found with id: " + _id));
        }
        response.send(user)
    } catch (errors) {
        response.status(404).send(errors.message)
    }
})

// update user
router.patch('/users/me', auth, async (request, response) => {
    // check updated parameters are valid or not
    const updatedParams = Object.keys(request.body)
    const userParams = ['name', 'age', 'email', 'password']
    const isValidKeys = updatedParams.every(param => { return userParams.includes(param) })
    if (!isValidKeys)
        response.status(400).send("Invalid Key to update")

    try {
        updatedParams.forEach((param) => request.user[param] = request.body[param])  // here request object is updated from 'auth" function
        await request.user.save()
        response.status(200).send(request.user)
    } catch (error) {
        response.status(400).send(error.message)
    }
})

// delete user 
router.delete('/users/me', auth, async (request, response) => {
    try {
        await request.user.remove() // here request object is updated from 'auth" function
        response.status(200).send({ "message": "User removed Successfully", user: request.user })
    } catch (error) {
        response.status(400).send(error.message)
    }
})

// logging out user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(t => {
            return t.token !== req.token // removing request.token from user.tokens array object
        })
        await req.user.save("Logout successfully !!")
        res.send()
    } catch (error) {
        res.send(400).send('Unbale to process')
    }
})

// logout all session
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send("Logout successfully from all other devices")
    } catch (error) {
        res.status(500).send("unable to logout...")
    }
})

module.exports = router