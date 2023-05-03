export function isManager (req, res){
    if(req.session.is_manager){
        return true;
    }
    else{
        return false;
    }
}