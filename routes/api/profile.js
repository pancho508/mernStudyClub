const express = require('express')
const request = require('request')
const config = require('config')
const router = express.Router()
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator/check')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

router.get('/me', auth, async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', 
        ['name', 'avatar'])

        if(!profile){
            return res.status(400).json({ msg: 'no profile found for user'})
        }

        res.json(profile)
    } catch{
        console.error(err.message)
        res.status(500).send('server error on getting profile')
    }
})

router.post('/', 
    [auth, 
        check('status', 'Status is required')
            .not()
            .isEmpty(),
        check('skills', 'Skills is required')
            .not()
            .isEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body

        const profileFields = {}
        profileFields.user = req.user.id
        if(company) profileFields.company = company
        if(website) profileFields.website = website
        if(location) profileFields.location = location
        if(bio) profileFields.bio = bio
        if(status) profileFields.status = status
        if(githubusername) profileFields.githubusername = githubusername
        if(skills) {
            profileFields.skills = skills.split(',').map(skills => skills.trim() )
        }

        profileFields.social = {}
        if(youtube) profileFields.social.youtube = youtube
        if(facebook) profileFields.social.facebook = facebook
        if(twitter) profileFields.social.twitter = twitter
        if(instagram) profileFields.social.instagram = instagram
        if(linkedin) profileFields.social.linkedin = linkedin

        try {
            let profile = await Profile.findOne({ user: req.user.id })
            //update the profile
            if(profile){
                profile = await Profile.findOneAndUpdate(
                    {user: req.user.id },
                    {$set: profileFields },
                    {new: true }
                )
                return res.json(profile)
            }
            //create the profile
            profile = new Profile(profileFields)
            await profile.save()
            res.json(profile)
        } catch (err) {
            console.error(err.message)
            res.status(500).send('server error on profile insert')
        }
        // res.send('ja')
    }
)

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name','avatar'])
        res.json(profiles)
    } catch (err) {
       console.error(err.message)
       res.status(500).send('server error on getting all profiles')
    }
})

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name','avatar'])
        if(!profile) return res.status(400).json({msg: 'no profile for this user'})
        res.json(profile)
    } catch (err) {
       console.error(err.message)
       if(err.kind == 'ObjectId'){
        return res.status(400).json({msg: 'no profile for this user'})
       }
       res.status(500).send('server error on getting all profiles')
    }
})

router.delete('/', auth, async (req, res) => {
    try {

      await Profile.findOneAndRemove({user: req.user.id})  

      await User.findOneAndRemove({_id: req.user.id})

      res.json({ msg: 'User was Deleted'})
    } catch (err) {
        console.error(err.message)
        res.status(500).send('server error on delete user')
    }
})

router.put('/experience', 
    [  
        auth, [
            check('title', 'Title is required')
                .not()
                .isEmpty(),
            check('company', 'Company is required')
                .not()
                .isEmpty(),
            check('from', 'from date is required')
                .not()
                .isEmpty()
        ]
    ],
 async (req, res) => {
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body
        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id })
            profile.experience.unshift(newExp)
            await profile.save()
            res.json(profile)
        } catch (err) {
            console.error(err.message)
            res.status(500).send('server error on put experience')
        }
    }
)

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1)
        await profile.save()
        res.json(profile)
    } catch (err) {
        
    }
})

router.put('/education', 
    [  
        auth, [
            check('school', 'school is required')
                .not()
                .isEmpty(),
            check('degree', 'degree is required')
                .not()
                .isEmpty(),
            check('fieldofstudy', 'fielofstudy is required')
                .not()
                .isEmpty(),
            check('from', 'from date is required')
                .not()
                .isEmpty()
        ]
    ],
 async (req, res) => {
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body
        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id })
            profile.education.unshift(newEdu)
            await profile.save()
            res.json(profile)
        } catch (err) {
            console.error(err.message)
            res.status(500).send('server error on put experience')
        }
    }
)

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1)
        await profile.save()
        res.json(profile)
    } catch (err) {
        
    }
})

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            methos: 'GET',
            headers: { 'user-agent': 'node.js'}
        }
        request(options, (err, response, body) => {
            if(err) console.error(err)
            if(response.statusCode !== 200){
                return res.status(400).json({ msg: 'no github profile found'})
            }
            res.json(JSON.parse(body))
        })
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

module.exports = router