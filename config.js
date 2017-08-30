module.exports = {
    // name: 'SkillSharing',
    env: process.env.NODE_ENV || 'development',
    port: process.env.port || '8888',
    base_url: process.env.BASE_URL || 'http://localhost:8888/',
    db:{
        uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillsharing'
    }
}