
# ==============================================================================
# HR MESSAGING & CHAT ENDPOINTS (Isolated for HR Portal)
# ==============================================================================

class HRChannelCreate(BaseModel):
    id: str
    name: str
    label: Optional[str]
    type: str
    members: List[str]

class HRChannelResponse(BaseModel):
    id: str
    name: str
    label: Optional[str]
    type: str
    members: List[str] = []

    @field_validator("members", mode="before")
    def parse_members(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True

class HRMessageCreate(BaseModel):
    text: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

class HRMessageResponse(BaseModel):
    id: int
    channel_id: str
    sender: str
    text: str
    timestamp: datetime
    is_edited: bool = False
    deleted_at: Optional[datetime] = None
    reactions: Optional[str] = None
    seen_by: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

    class Config:
        from_attributes = True

class HRMessageUpdate(BaseModel):
    text: Optional[str] = None
    reactions: Optional[str] = None # JSON string of reactions
    seen_by: Optional[str] = None # JSON string of seen users

class HRChannelUpdate(BaseModel):
    name: Optional[str] = None
    label: Optional[str] = None

class HRMembersUpdate(BaseModel):
    members: List[str]

class HRUserDetailResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    photo: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/chat/users", response_model=List[HRUserDetailResponse])
def get_all_users_for_chat(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    return db.query(models.User).filter(models.User.role != "admin").all()

@router.get("/chat/channels", response_model=List[HRChannelResponse])
def hr_get_channels(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    return db.query(models.ChatChannel).all()

@router.post("/chat/channels", response_model=HRChannelResponse, status_code=status.HTTP_201_CREATED)
def hr_create_channel(req: HRChannelCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    import json
    new_channel = models.ChatChannel(
        id=req.id,
        name=req.name,
        label=req.label,
        type=req.type,
        members=json.dumps(req.members)
    )
    db.add(new_channel)
    db.commit()
    db.refresh(new_channel)
    return new_channel

@router.get("/chat/channels/{channel_id}/messages", response_model=List[HRMessageResponse])
def hr_get_channel_messages(channel_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    return db.query(models.ChatMessage).filter(models.ChatMessage.channel_id == channel_id).order_by(models.ChatMessage.timestamp.asc()).all()

@router.post("/chat/channels/{channel_id}/send", response_model=HRMessageResponse, status_code=status.HTTP_201_CREATED)
def hr_send_message(channel_id: str, req: HRMessageCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    sender_name = current_user.name
    if current_user.role == "hr":
        sender_name += " (HR)"
        
    new_msg = models.ChatMessage(
        channel_id=channel_id,
        sender=sender_name,
        text=req.text,
        timestamp=datetime.utcnow(),
        attachment_url=req.attachment_url,
        attachment_type=req.attachment_type
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@router.patch("/chat/messages/{message_id}", response_model=HRMessageResponse)
def hr_update_message(message_id: int, req: HRMessageUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if req.text is not None:
        msg.text = req.text
        msg.is_edited = True
    if req.reactions is not None:
        msg.reactions = req.reactions
    if req.seen_by is not None:
        msg.seen_by = req.seen_by
        
    db.commit()
    db.refresh(msg)
    return msg

@router.delete("/chat/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def hr_delete_message(message_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.deleted_at = datetime.utcnow()
    db.commit()
    return None

@router.put("/chat/channels/{channel_id}/members", response_model=HRChannelResponse)
def hr_update_channel_members(channel_id: str, req: HRMembersUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    import json
    channel.members = json.dumps(req.members)
    db.commit()
    db.refresh(channel)
    return channel

@router.patch("/chat/channels/{channel_id}", response_model=HRChannelResponse)
def hr_update_channel(channel_id: str, req: HRChannelUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if req.name is not None:
        channel.name = req.name
    if req.label is not None:
        channel.label = req.label
        
    db.commit()
    db.refresh(channel)
    return channel

@router.delete("/chat/channels/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
def hr_delete_channel(channel_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    db.delete(channel)
    db.commit()
    return None

@router.post("/chat/upload")
async def hr_upload_file(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    try:
        import os, uuid
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        os.makedirs(os.path.join("uploads", "chat"), exist_ok=True)
        filepath = os.path.join("uploads", "chat", unique_filename)
        
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
            
        file_url = f"/uploads/chat/{unique_filename}"
        file_type = "image" if file.content_type.startswith("image/") else ("video" if file.content_type.startswith("video/") else "document")
        
        return {"url": file_url, "type": file_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
