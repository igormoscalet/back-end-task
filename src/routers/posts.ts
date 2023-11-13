import { Router, RequestHandler } from 'express';
import { Op } from 'sequelize';

import type { SequelizeClient } from '../sequelize';
import { Post, User } from '../repositories/types';
import { initTokenValidationRequestHandler, initAdminValidationRequestHandler, RequestAuth } from '../middleware/security';
import { ForbiddenError, NotFoundError } from '../errors';
import { UserType } from '../constants';


export function initPostsRouter(sequelizeClient: SequelizeClient): Router {
    const router = Router({ mergeParams: true });

    const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);

    router.route('/create')
      .post(tokenValidation, initCreatePostRequestHandler(sequelizeClient));
    router.route('/update/:id')
      .post(tokenValidation, initUpdatePostRequestHandler(sequelizeClient));
    router.route('/remove/:id')
      .post(tokenValidation, initRemovePostRequestHandler(sequelizeClient));
    router.route('/hide/:id')
      .post(tokenValidation, initHidePostRequestHandler(sequelizeClient));
    router.route('/show/:id')
      .post(tokenValidation, initShowPostRequestHandler(sequelizeClient));
    router.route('/getpost/:id')
        .get(tokenValidation, initGetPostRequestHandler(sequelizeClient));
    router.route('/list')
        .get(tokenValidation, initListPostsRequestHandler(sequelizeClient));

    return router;
  }

  function initGetPostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function getPostRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
        const {
            token,
            user,
          } = (req as any).auth as RequestAuth;

        const postId = req.params.id;

        const post = await models.posts.findOne({where: {id: req.params.id}}) as Post || null;
        
        // Check if post with such id exists
        if(post){
            // return post if admin
            if(user.type === UserType.ADMIN){
                res.send(post)
            }
            // return post if its public for any user
            else if(post.isHidden == false){
                res.send(post)
            }
            // return hidden post if the request is made by post author
            else if(post.isHidden == true && user.id == post.authorId){
                res.send(post)
            }
            // throw not found error if the request is made by non-admin user and not post author to not disclose post existance for third parties
            else{
                throw new NotFoundError("NOT_FOUND_ERROR", "GET_POST", postId.toString())
            }
        }
        else{
            throw new NotFoundError("NOT_FOUND_ERROR", "GET_POST", postId.toString());
        }

      return res.end();
    } catch (error) {
      next(error);
    }
  };
}

function initListPostsRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
    return async function listPostsRequestHandler(req, res, next): Promise<void> {
      const { models } = sequelizeClient;
  
      try {

        const {
            token,
            user,
          } = (req as any).auth as RequestAuth;
  
        const isAdmin = user.type === UserType.ADMIN;
  
        if(isAdmin){
            const posts = await models.posts.findAll();
            res.send(posts);
        }
        else{
            const publicPosts = await models.posts.findAll({where: {isHidden: false}});
            const hiddenRequestedUserPosts = await models.posts.findAll({where: {isHidden: true, authorId: user.id}});
            const allPosts = [...publicPosts, ...hiddenRequestedUserPosts];
            res.send(allPosts);
        }

        return res.end();
      } catch (error) {
        next(error);
      }
    };
  }

  function initCreatePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
    return async function createPostRequestHandler(req, res, next): Promise<void> {
      try {
        const {
            token,
            user,
          } = (req as any).auth as RequestAuth;
        const { title, content } = req.body as CreatePostData;

        console.log(user.id);
  
        await createPost({ title, content }, user.id, sequelizeClient);
  
        return res.status(204).end();
      } catch (error) {
        next(error);
      }
    };
  }
  function initUpdatePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
    return async function updatePostRequestHandler(req, res, next): Promise<void> {
      try {
        const {
            token,
            user,
          } = (req as any).auth as RequestAuth;

        const postId = req.params.id;

        const { title, content } = req.body as CreatePostData;
  
        const updateTime = new Date().valueOf;
    
        const { models } = sequelizeClient;

        const postById = await models.posts.findOne({attributes: ["id", "authorId"], where: {id: postId}}) as Post | null;
        
        // Check if post with such ID exists
        if(postById){
            // Check if user owner post is the same one authorised to update
            if(postById.authorId == user.id || user.type === UserType.ADMIN){
                await models.posts.update({title: title, content: content, updatedAt: updateTime}, { where: {id: postId}});
            }
            else{
                throw new ForbiddenError("POST_NOT_FROM_USER_AND_USER_IS_NOT_ADMIN");
            }
        }
        else{
            throw new NotFoundError("NOT_FOUND_ERROR", "UPDATE_POST", postId.toString());
        }
  
        return res.status(204).end();
      } catch (error) {
        next(error);
      }
    };
  }

  function initHidePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
    return async function hidePostRequestHandler(req, res, next): Promise<void> {
      try {
        const {
            token,
            user,
          } = (req as any).auth as RequestAuth;

        const postId = req.params.id;
    
        const { models } = sequelizeClient;

        const postById = await models.posts.findOne({attributes: ["id", "authorId"], where: {id: postId}}) as Post | null;
        
        const isHiddenNewValue = true;
        
        // Check if post with such ID exists
        if(postById){
            // Check if user owner post is the same one authorised to update
            if(postById.authorId == user.id || user.type == UserType.ADMIN){
                await models.posts.update({isHidden: isHiddenNewValue}, { where: {id: postId}});
            }
            else{
                throw new ForbiddenError("POST_NOT_FROM_USER_AND_USER_IS_NOT_ADMIN");
            }
        }
        else{
            throw new NotFoundError("NOT_FOUND_ERROR", "HIDE_POST", postId.toString());
        }
  
        return res.status(204).end();
      } catch (error) {
        next(error);
      }
    };
  }

  function initShowPostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
    return async function showPostRequestHandler(req, res, next): Promise<void> {
      try {
        const {
            token,
            user,
          } = (req as any).auth as RequestAuth;

        const postId = req.params.id;
    
        const { models } = sequelizeClient;

        const postById = await models.posts.findOne({attributes: ["id", "authorId"], where: {id: postId}}) as Post | null;
        
        const isHiddenNewValue = false;
        
        // Check if post with such ID exists
        if(postById){
            // Check if user owner post is the same one authorised to update
            if(postById.authorId == user.id || user.type === UserType.ADMIN){
                await models.posts.update({isHidden: isHiddenNewValue}, { where: {id: postId}});
            }
            else{
                throw new ForbiddenError("POST_NOT_FROM_USER_AND_USER_IS_NOT_ADMIN");
            }
        }
        else{
            throw new NotFoundError("NOT_FOUND_ERROR", "SHOW_POST", postId.toString());
        }
  
        return res.status(204).end();
      } catch (error) {
        next(error);
      }
    };
  }

  function initRemovePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
    return async function removePostRequestHandler(req, res, next): Promise<void> {
      try {
        const {
            token,
            user,
          } = (req as any).auth as RequestAuth;

        const postId = req.params.id;
    
        const { models } = sequelizeClient;

        const postById = await models.posts.findOne({attributes: ["id", "authorId"], where: {id: postId}}) as Post | null;
        console.log(postById);
        
        // Check if post with such ID exists
        if(postById){
            // Check if user owner post is the same one authorised to update OR the user is admin
            console.log("authorID: " + postById.authorId);
            console.log("userID: " + user.id);
            if(postById.authorId == user.id || user.type === UserType.ADMIN){
                await models.posts.destroy({ where: {id: postId}});
            }
            else{
                throw new ForbiddenError("POST_NOT_FROM_USER_AND_USER_IS_NOT_ADMIN");
            }
        }
        else{
            throw new NotFoundError("NOT_FOUND_ERROR", "REMOVE_POST", postId.toString());
        }
  
        return res.status(204).end();
      } catch (error) {
        next(error);
      }
    };
  }

async function createPost(data: CreatePostData, authorId: number, sequelizeClient: SequelizeClient): Promise<void> {
    const { title, content } = data;

    const { models } = sequelizeClient;

    console.log("CREATEPOST AUTHORID: ", authorId);

    const isHidden = false;

    await models.posts.create({title, content, authorId, isHidden});
  
}



type CreatePostData = {
    title: string;
    content: string;
}