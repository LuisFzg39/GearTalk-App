import { NextFunction, Request, Response } from 'express';
import { TranslateRequestBody } from './translation.types';
import * as translationService from './translation.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    const error = new Error('Unauthorized') as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  return req.user;
};

export const translate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { text, source_lang, target_lang } = req.body as Partial<TranslateRequestBody>;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ message: 'text is required' });
      return;
    }
    if (!target_lang || typeof target_lang !== 'string') {
      res.status(400).json({ message: 'target_lang is required' });
      return;
    }

    const sourceLang =
      source_lang && typeof source_lang === 'string'
        ? translationService.normalizeLangCode(source_lang)
        : await translationService.getPreferredLanguage(user.id);

    const targetLang = translationService.normalizeLangCode(target_lang);

    const translated = await translationService.translateText(text, sourceLang, targetLang);

    res.status(200).json({
      text: translated,
      source_lang: sourceLang,
      target_lang: targetLang,
    });
  } catch (err) {
    next(err);
  }
};

export const bundleUi = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const raw = req.body?.target_lang;
    let targetLang: string | undefined;

    if (typeof raw === 'string' && raw.trim()) {
      targetLang = translationService.normalizeLangCode(raw);
    } else if (req.user) {
      targetLang = await translationService.getPreferredLanguage(req.user.id);
    }

    if (!targetLang) {
      res.status(400).json({ message: 'target_lang is required when not signed in' });
      return;
    }

    const strings = await translationService.translateUiBundle(targetLang);
    res.status(200).json({ target_lang: targetLang, strings });
  } catch (err) {
    next(err);
  }
};

export const translationController = { translate, bundleUi };
